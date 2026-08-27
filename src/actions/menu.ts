"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCafeStaff } from "@/lib/authz";
import { menuCategorySchema, menuItemSchema } from "@/lib/validations";
import { broadcastToCafe } from "@/lib/realtime";
import type { ActionResult } from "./auth";

/** Prisma's Decimal fields aren't plain objects — Client Components can only receive serializable props. */
function serializeMenuCategories<
  T extends { items: { price: unknown; [k: string]: unknown }[]; [k: string]: unknown },
>(categories: T[]) {
  return categories.map((c) => ({ ...c, items: c.items.map((i) => ({ ...i, price: Number(i.price) })) }));
}

export async function listOwnerMenu() {
  const { cafeId } = await requireCafeStaff(["OWNER"]);
  const categories = await prisma.menuCategory.findMany({
    where: { cafeId },
    include: { items: { orderBy: { createdAt: "asc" } } },
    orderBy: { sortOrder: "asc" },
  });
  return serializeMenuCategories(categories);
}

/** Full menu (including unavailable items, greyed out client-side) for staff POS use. */
export async function listStaffMenu() {
  const { cafeId } = await requireCafeStaff(["OWNER", "WAITER"]);
  const categories = await prisma.menuCategory.findMany({
    where: { cafeId },
    include: { items: { orderBy: { createdAt: "asc" } } },
    orderBy: { sortOrder: "asc" },
  });
  return serializeMenuCategories(categories);
}

export async function createMenuCategory(input: unknown): Promise<ActionResult> {
  const { cafeId } = await requireCafeStaff(["OWNER"]);
  const parsed = menuCategorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Xatolik" };

  const count = await prisma.menuCategory.count({ where: { cafeId } });
  await prisma.menuCategory.create({ data: { cafeId, name: parsed.data.name, sortOrder: count } });
  revalidatePath("/dashboard/owner/menu");
  return { ok: true, data: undefined };
}

export async function deleteMenuCategory(id: string): Promise<ActionResult> {
  const { cafeId } = await requireCafeStaff(["OWNER"]);
  await prisma.menuCategory.deleteMany({ where: { id, cafeId } });
  revalidatePath("/dashboard/owner/menu");
  return { ok: true, data: undefined };
}

export async function createMenuItem(input: unknown): Promise<ActionResult> {
  const { cafeId } = await requireCafeStaff(["OWNER"]);
  const parsed = menuItemSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Xatolik" };
  const { categoryId, name, description, price, imageUrl, prepTimeMin, isAvailable } = parsed.data;

  const category = await prisma.menuCategory.findFirst({ where: { id: categoryId, cafeId } });
  if (!category) return { ok: false, error: "Kategoriya topilmadi" };

  await prisma.menuItem.create({
    data: { cafeId, categoryId, name, description: description || null, price, imageUrl: imageUrl || null, prepTimeMin: prepTimeMin ?? null, isAvailable },
  });
  revalidatePath("/dashboard/owner/menu");
  revalidatePath("/[slug]", "page");
  return { ok: true, data: undefined };
}

export async function updateMenuItem(id: string, input: unknown): Promise<ActionResult> {
  const { cafeId } = await requireCafeStaff(["OWNER"]);
  const parsed = menuItemSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Xatolik" };
  const { categoryId, name, description, price, imageUrl, prepTimeMin, isAvailable } = parsed.data;

  const existing = await prisma.menuItem.findFirst({ where: { id, cafeId } });
  if (!existing) return { ok: false, error: "Taom topilmadi" };

  await prisma.menuItem.update({
    where: { id },
    data: { categoryId, name, description: description || null, price, imageUrl: imageUrl || null, prepTimeMin: prepTimeMin ?? null, isAvailable },
  });
  revalidatePath("/dashboard/owner/menu");
  revalidatePath("/[slug]", "page");
  return { ok: true, data: undefined };
}

export async function toggleMenuItemAvailability(id: string, isAvailable: boolean): Promise<ActionResult> {
  const { cafeId } = await requireCafeStaff(["OWNER"]);
  const item = await prisma.menuItem.findFirst({ where: { id, cafeId } });
  if (!item) return { ok: false, error: "Taom topilmadi" };
  await prisma.menuItem.update({ where: { id }, data: { isAvailable } });
  await broadcastToCafe(cafeId, "menu:updated", { id, isAvailable });
  revalidatePath("/dashboard/owner/menu");
  revalidatePath("/[slug]", "page");
  return { ok: true, data: undefined };
}

export async function deleteMenuItem(id: string): Promise<ActionResult> {
  const { cafeId } = await requireCafeStaff(["OWNER"]);
  await prisma.menuItem.deleteMany({ where: { id, cafeId } });
  revalidatePath("/dashboard/owner/menu");
  revalidatePath("/[slug]", "page");
  return { ok: true, data: undefined };
}

/** Public menu for the customer-facing ordering page — only available items. */
export async function getPublicMenu(cafeSlug: string) {
  const cafe = await prisma.cafe.findUnique({
    where: { slug: cafeSlug, status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      description: true,
      logoUrl: true,
      bannerUrl: true,
      address: true,
      workingHours: true,
      deliveryFee: true,
      minOrderTotal: true,
      categories: {
        orderBy: { sortOrder: "asc" },
        include: { items: { where: { isAvailable: true }, orderBy: { createdAt: "asc" } } },
      },
    },
  });
  if (!cafe) return null;
  return {
    ...cafe,
    deliveryFee: Number(cafe.deliveryFee),
    minOrderTotal: Number(cafe.minOrderTotal),
    categories: serializeMenuCategories(cafe.categories),
  };
}
