"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCafeStaff } from "@/lib/authz";
import { menuCategorySchema, menuItemSchema, menuItemVariantSchema } from "@/lib/validations";
import { broadcastToCafe } from "@/lib/realtime";
import type { ActionResult } from "./auth";

const itemsWithVariants = {
  orderBy: { createdAt: "asc" as const },
  include: { variants: { orderBy: { sortOrder: "asc" as const } } },
};

/** Prisma's Decimal fields aren't plain objects — Client Components can only receive serializable props. */
function serializeMenuCategories<
  T extends {
    items: { price: unknown; variants: { price: unknown; [k: string]: unknown }[]; [k: string]: unknown }[];
    [k: string]: unknown;
  },
>(categories: T[]) {
  return categories.map((c) => ({
    ...c,
    items: c.items.map((i) => ({
      ...i,
      price: Number(i.price),
      variants: i.variants.map((v) => ({ ...v, price: Number(v.price) })),
    })),
  }));
}

export async function listOwnerMenu() {
  const { cafeId } = await requireCafeStaff(["OWNER"]);
  const categories = await prisma.menuCategory.findMany({
    where: { cafeId },
    include: { items: itemsWithVariants },
    orderBy: { sortOrder: "asc" },
  });
  return serializeMenuCategories(categories);
}

/** Full menu (including unavailable items, greyed out client-side) for staff POS use. */
export async function listStaffMenu() {
  const { cafeId } = await requireCafeStaff(["OWNER", "WAITER"]);
  const categories = await prisma.menuCategory.findMany({
    where: { cafeId },
    include: { items: itemsWithVariants },
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

/** menuItem's own scoping (cafeId) is checked so a variant can't be attached to another cafe's item. */
async function ownedMenuItem(cafeId: string, menuItemId: string) {
  return prisma.menuItem.findFirst({ where: { id: menuItemId, cafeId } });
}

export async function createMenuItemVariant(menuItemId: string, input: unknown): Promise<ActionResult> {
  const { cafeId } = await requireCafeStaff(["OWNER"]);
  const parsed = menuItemVariantSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Xatolik" };

  const item = await ownedMenuItem(cafeId, menuItemId);
  if (!item) return { ok: false, error: "Taom topilmadi" };

  const count = await prisma.menuItemVariant.count({ where: { menuItemId } });
  await prisma.menuItemVariant.create({
    data: { menuItemId, name: parsed.data.name, price: parsed.data.price, sortOrder: count },
  });
  revalidatePath("/dashboard/owner/menu");
  revalidatePath("/[slug]", "page");
  return { ok: true, data: undefined };
}

export async function updateMenuItemVariant(id: string, input: unknown): Promise<ActionResult> {
  const { cafeId } = await requireCafeStaff(["OWNER"]);
  const parsed = menuItemVariantSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Xatolik" };

  const existing = await prisma.menuItemVariant.findFirst({ where: { id, menuItem: { cafeId } } });
  if (!existing) return { ok: false, error: "Variant topilmadi" };

  await prisma.menuItemVariant.update({ where: { id }, data: { name: parsed.data.name, price: parsed.data.price } });
  revalidatePath("/dashboard/owner/menu");
  revalidatePath("/[slug]", "page");
  return { ok: true, data: undefined };
}

export async function deleteMenuItemVariant(id: string): Promise<ActionResult> {
  const { cafeId } = await requireCafeStaff(["OWNER"]);
  await prisma.menuItemVariant.deleteMany({ where: { id, menuItem: { cafeId } } });
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
        include: { items: { where: { isAvailable: true }, ...itemsWithVariants } },
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
