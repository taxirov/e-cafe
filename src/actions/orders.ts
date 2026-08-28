"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCafeStaff } from "@/lib/authz";
import { placeGuestOrderSchema, placeStaffOrderSchema, ORDER_STATUSES, type OrderStatusValue } from "@/lib/validations";
import { broadcastToCafe, broadcastToOrder, createRealtimeToken, cafeRoom, orderRoom } from "@/lib/realtime";
import type { ActionResult } from "./auth";

const orderInclude = {
  items: { include: { menuItem: true, variant: true } },
  table: true,
} as const;

/** Prices are always re-read from the DB here — the client cart is never trusted for money. */
async function priceCartItems(
  cafeId: string,
  items: { menuItemId: string; variantId?: string | null; qty: number; note?: string | null }[]
) {
  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: items.map((i) => i.menuItemId) }, cafeId, isAvailable: true },
    include: { variants: true },
  });
  const byId = new Map(menuItems.map((m) => [m.id, m]));

  const lines: {
    menuItemId: string;
    variantId: string | null;
    variantName: string | null;
    qty: number;
    priceAtOrder: number;
    note: string | null;
  }[] = [];
  for (const line of items) {
    const item = byId.get(line.menuItemId);
    if (!item) return { ok: false as const, error: `"${line.menuItemId}" taomi hozir mavjud emas` };

    if (item.variants.length > 0) {
      const variant = item.variants.find((v) => v.id === line.variantId);
      if (!variant) return { ok: false as const, error: `"${item.name}" uchun variant tanlanishi shart` };
      lines.push({
        menuItemId: item.id,
        variantId: variant.id,
        variantName: variant.name,
        qty: line.qty,
        priceAtOrder: Number(variant.price),
        note: line.note ?? null,
      });
    } else {
      lines.push({
        menuItemId: item.id,
        variantId: null,
        variantName: null,
        qty: line.qty,
        priceAtOrder: Number(item.price),
        note: line.note ?? null,
      });
    }
  }
  const subtotal = lines.reduce((sum, l) => sum + l.priceAtOrder * l.qty, 0);
  return { ok: true as const, lines, subtotal };
}

/** Guest self-order — QR dine-in (tableToken), or delivery/pickup off the cafe's public page. No login required. */
export async function placeGuestOrder(input: unknown): Promise<ActionResult<{ orderId: string }>> {
  const parsed = placeGuestOrderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Xatolik" };
  const { cafeId, type, tableToken, items, customerName, customerPhone, address, note } = parsed.data;

  const cafe = await prisma.cafe.findUnique({ where: { id: cafeId } });
  if (!cafe || cafe.status !== "ACTIVE") return { ok: false, error: "Kafe hozircha buyurtma qabul qilmayapti" };

  let tableId: string | null = null;
  if (type === "DINE_IN") {
    const table = await prisma.cafeTable.findUnique({ where: { qrToken: tableToken ?? "" } });
    if (!table || table.cafeId !== cafeId) return { ok: false, error: "Stol topilmadi — QR kodni qaytadan skanerlang" };
    tableId = table.id;
  }

  const priced = await priceCartItems(cafeId, items);
  if (!priced.ok) return priced;

  if (Number(cafe.minOrderTotal) > 0 && priced.subtotal < Number(cafe.minOrderTotal)) {
    return { ok: false, error: `Minimal buyurtma summasi ${Number(cafe.minOrderTotal)} so'm` };
  }

  const deliveryFee = type === "DELIVERY" ? Number(cafe.deliveryFee) : 0;
  const total = priced.subtotal + deliveryFee;

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        cafeId,
        tableId,
        type,
        subtotal: priced.subtotal,
        deliveryFee,
        total,
        customerName: customerName || null,
        customerPhone: customerPhone || null,
        address: address || null,
        note: note || null,
        items: { create: priced.lines },
      },
      include: orderInclude,
    });
    if (tableId) await tx.cafeTable.update({ where: { id: tableId }, data: { status: "OCCUPIED" } });
    return created;
  });

  await broadcastToCafe(cafeId, "order:new", serializeOrder(order));
  if (tableId) await broadcastToCafe(cafeId, "table:updated", { id: tableId, status: "OCCUPIED" });
  revalidatePath("/dashboard/waiter");
  revalidatePath("/dashboard/kitchen");
  revalidatePath("/dashboard/owner");

  return { ok: true, data: { orderId: order.id } };
}

/** Entered by a waiter at the table, via POS. */
export async function placeStaffOrder(input: unknown): Promise<ActionResult<{ orderId: string }>> {
  const { session, cafeId } = await requireCafeStaff(["WAITER", "OWNER"]);
  const parsed = placeStaffOrderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Xatolik" };
  const { tableId, items, note } = parsed.data;

  const table = await prisma.cafeTable.findFirst({ where: { id: tableId, cafeId } });
  if (!table) return { ok: false, error: "Stol topilmadi" };

  const priced = await priceCartItems(cafeId, items);
  if (!priced.ok) return priced;

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        cafeId,
        tableId,
        type: "DINE_IN",
        status: "CONFIRMED",
        subtotal: priced.subtotal,
        total: priced.subtotal,
        note: note || null,
        createdById: session.user.id,
        items: { create: priced.lines },
      },
      include: orderInclude,
    });
    await tx.cafeTable.update({ where: { id: tableId }, data: { status: "OCCUPIED" } });
    return created;
  });

  await broadcastToCafe(cafeId, "order:new", serializeOrder(order));
  if (tableId) await broadcastToCafe(cafeId, "table:updated", { id: tableId, status: "OCCUPIED" });
  revalidatePath("/dashboard/waiter");
  revalidatePath("/dashboard/kitchen");
  revalidatePath("/dashboard/owner");

  return { ok: true, data: { orderId: order.id } };
}

export async function updateOrderStatus(orderId: string, status: OrderStatusValue): Promise<ActionResult> {
  const { cafeId } = await requireCafeStaff(["OWNER", "WAITER", "KITCHEN"]);
  if (!ORDER_STATUSES.includes(status)) return { ok: false, error: "Noto'g'ri holat" };

  const existing = await prisma.order.findFirst({ where: { id: orderId, cafeId } });
  if (!existing) return { ok: false, error: "Buyurtma topilmadi" };

  const { order, freedTableId } = await prisma.$transaction(async (tx) => {
    const updated = await tx.order.update({ where: { id: orderId }, data: { status }, include: orderInclude });
    let freedTableId: string | null = null;
    if (updated.tableId && (status === "COMPLETED" || status === "CANCELLED")) {
      const otherActive = await tx.order.count({
        where: { tableId: updated.tableId, id: { not: orderId }, status: { notIn: ["COMPLETED", "CANCELLED"] } },
      });
      if (otherActive === 0) {
        await tx.cafeTable.update({ where: { id: updated.tableId }, data: { status: "FREE" } });
        freedTableId = updated.tableId;
      }
    }
    return { order: updated, freedTableId };
  });

  await broadcastToCafe(cafeId, "order:updated", serializeOrder(order));
  await broadcastToOrder(orderId, "order:updated", serializeOrder(order));
  if (freedTableId) await broadcastToCafe(cafeId, "table:updated", { id: freedTableId, status: "FREE" });
  revalidatePath("/dashboard/waiter");
  revalidatePath("/dashboard/kitchen");
  revalidatePath("/dashboard/owner");

  return { ok: true, data: undefined };
}

/**
 * Closes out an order: records how it was paid and marks it COMPLETED — the
 * point a dine-in table frees up again, or a delivery/pickup order is
 * considered done. Returns the finished order so the caller can show a
 * receipt without a second round-trip.
 */
export async function completeOrder(
  orderId: string,
  paymentMethod: "CASH" | "CARD" | "ONLINE"
): Promise<ActionResult<SerializedOrder>> {
  const { cafeId } = await requireCafeStaff(["OWNER", "WAITER"]);

  const existing = await prisma.order.findFirst({ where: { id: orderId, cafeId } });
  if (!existing) return { ok: false, error: "Buyurtma topilmadi" };
  if (existing.status === "CANCELLED") return { ok: false, error: "Bekor qilingan buyurtmani yakunlab bo'lmaydi" };

  const { order, freedTableId } = await prisma.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id: orderId },
      data: { status: "COMPLETED", paymentMethod },
      include: orderInclude,
    });
    let freedTableId: string | null = null;
    if (updated.tableId) {
      const otherActive = await tx.order.count({
        where: { tableId: updated.tableId, id: { not: orderId }, status: { notIn: ["COMPLETED", "CANCELLED"] } },
      });
      if (otherActive === 0) {
        await tx.cafeTable.update({ where: { id: updated.tableId }, data: { status: "FREE" } });
        freedTableId = updated.tableId;
      }
    }
    return { order: updated, freedTableId };
  });

  const serialized = serializeOrder(order);
  await broadcastToCafe(cafeId, "order:updated", serialized);
  await broadcastToOrder(orderId, "order:updated", serialized);
  if (freedTableId) await broadcastToCafe(cafeId, "table:updated", { id: freedTableId, status: "FREE" });
  revalidatePath("/dashboard/waiter");
  revalidatePath("/dashboard/kitchen");
  revalidatePath("/dashboard/owner");
  revalidatePath("/dashboard/owner/orders");

  return { ok: true, data: serialized };
}

export async function listCafeOrders(statuses?: OrderStatusValue[]) {
  const { cafeId } = await requireCafeStaff(["OWNER", "WAITER", "KITCHEN"]);
  return prisma.order.findMany({
    where: { cafeId, ...(statuses ? { status: { in: statuses } } : {}) },
    include: orderInclude,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function listCafeOrdersSerialized(statuses?: OrderStatusValue[]) {
  const orders = await listCafeOrders(statuses);
  return orders.map(serializeOrder);
}

/** Order id itself is the bearer capability (unguessable cuid) — no login for guest tracking. */
export async function getGuestOrder(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: orderInclude });
  return order ? serializeOrder(order) : null;
}

export async function getStaffRealtimeToken() {
  const { session, cafeId } = await requireCafeStaff();
  return createRealtimeToken({ room: cafeRoom(cafeId), userId: session.user.id, role: session.user.role });
}

export async function getGuestOrderRealtimeToken(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { id: true } });
  if (!order) return null;
  return createRealtimeToken({ room: orderRoom(order.id), userId: "guest", role: "CUSTOMER" });
}

function serializeOrder(order: {
  id: string;
  cafeId: string;
  tableId: string | null;
  type: string;
  status: string;
  subtotal: unknown;
  deliveryFee: unknown;
  total: unknown;
  paymentMethod: string | null;
  customerName: string | null;
  customerPhone: string | null;
  address: string | null;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
  table: { id: string; label: string } | null;
  items: {
    id: string;
    qty: number;
    priceAtOrder: unknown;
    note: string | null;
    variantName: string | null;
    menuItem: { id: string; name: string };
  }[];
}) {
  return {
    id: order.id,
    cafeId: order.cafeId,
    tableId: order.tableId,
    tableLabel: order.table?.label ?? null,
    type: order.type,
    status: order.status,
    subtotal: Number(order.subtotal),
    deliveryFee: Number(order.deliveryFee),
    total: Number(order.total),
    paymentMethod: order.paymentMethod,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    address: order.address,
    note: order.note,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    items: order.items.map((i) => ({
      id: i.id,
      name: i.variantName ? `${i.menuItem.name} (${i.variantName})` : i.menuItem.name,
      qty: i.qty,
      price: Number(i.priceAtOrder),
      note: i.note,
    })),
  };
}
export type SerializedOrder = ReturnType<typeof serializeOrder>;
