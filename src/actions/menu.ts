"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCafeStaff, requireRole } from "@/lib/authz";
import { menuCategorySchema, dishSchema, menuItemSchema, menuItemVariantSchema } from "@/lib/validations";
import { broadcastToCafe } from "@/lib/realtime";
import type { ActionResult } from "./auth";
import type { Prisma } from "@/generated/prisma/client";

const menuItemWithDish = {
  include: { dish: true, variants: { orderBy: { sortOrder: "asc" as const } } },
  orderBy: { createdAt: "asc" as const },
};

type MenuItemWithDish = Prisma.MenuItemGetPayload<typeof menuItemWithDish>;

/** Shapes a cafe's flat MenuItem rows into the "categories -> items" tree the menu UIs expect. */
function groupByCategory(categories: { id: string; name: string; sortOrder: number }[], items: MenuItemWithDish[]) {
  return categories
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((c) => ({
      id: c.id,
      name: c.name,
      items: items.filter((i) => i.dish.categoryId === c.id).map((i) => serializeItem(i)),
    }));
}

function serializeItem(i: MenuItemWithDish) {
  return {
    id: i.id,
    dishId: i.dishId,
    categoryId: i.dish.categoryId,
    name: i.dish.name,
    description: i.dish.description,
    imageUrl: i.dish.imageUrl,
    price: Number(i.price),
    isAvailable: i.isAvailable,
    prepTimeMin: i.prepTimeMin,
    variants: i.variants.map((v) => ({ id: v.id, name: v.name, price: Number(v.price) })),
  };
}

// ---------------------------------------------------------------------------
// Global categories (Super Admin)
// ---------------------------------------------------------------------------

export async function listMenuCategories() {
  await requireRole(["SUPER_ADMIN", "OWNER", "WAITER"]);
  return prisma.menuCategory.findMany({ orderBy: { sortOrder: "asc" } });
}

export async function createMenuCategory(input: unknown): Promise<ActionResult> {
  await requireRole(["SUPER_ADMIN"]);
  const parsed = menuCategorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Xatolik" };

  const existing = await prisma.menuCategory.findFirst({ where: { name: { equals: parsed.data.name, mode: "insensitive" } } });
  if (existing) return { ok: false, error: "Bu nomdagi kategoriya allaqachon mavjud" };

  const count = await prisma.menuCategory.count();
  await prisma.menuCategory.create({ data: { name: parsed.data.name, sortOrder: count } });
  revalidatePath("/dashboard/admin/categories");
  return { ok: true, data: undefined };
}

export async function deleteMenuCategory(id: string): Promise<ActionResult> {
  await requireRole(["SUPER_ADMIN"]);
  const dishCount = await prisma.dishCatalog.count({ where: { categoryId: id } });
  if (dishCount > 0) return { ok: false, error: "Bu kategoriyada taomlar bor — avval ularni ko'chiring yoki o'chiring" };

  await prisma.menuCategory.deleteMany({ where: { id } });
  revalidatePath("/dashboard/admin/categories");
  return { ok: true, data: undefined };
}

// ---------------------------------------------------------------------------
// Shared dish catalog
// ---------------------------------------------------------------------------

/** Live-search across the shared dish catalog, for the owner's "pick an existing dish" flow. */
export async function searchDishCatalog(query: string) {
  await requireCafeStaff(["OWNER"]);
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const dishes = await prisma.dishCatalog.findMany({
    where: { name: { contains: trimmed, mode: "insensitive" } },
    include: { category: true },
    orderBy: { name: "asc" },
    take: 20,
  });
  return dishes.map((d) => ({
    id: d.id,
    name: d.name,
    description: d.description,
    imageUrl: d.imageUrl,
    categoryId: d.categoryId,
    categoryName: d.category.name,
  }));
}

/** Owner-editable shared dish fields — changes are visible to every cafe listing this dish. */
export async function updateDish(id: string, input: unknown): Promise<ActionResult> {
  await requireCafeStaff(["OWNER"]);
  const parsed = dishSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Xatolik" };

  const existing = await prisma.dishCatalog.findUnique({ where: { id } });
  if (!existing) return { ok: false, error: "Taom topilmadi" };

  await prisma.dishCatalog.update({
    where: { id },
    data: {
      name: parsed.data.name,
      categoryId: parsed.data.categoryId,
      description: parsed.data.description || null,
      imageUrl: parsed.data.imageUrl || null,
    },
  });
  revalidatePath("/dashboard/owner/menu");
  revalidatePath("/[slug]", "page");
  return { ok: true, data: undefined };
}

// ---------------------------------------------------------------------------
// A cafe's own menu (its MenuItem listings of shared dishes)
// ---------------------------------------------------------------------------

export async function listOwnerMenu() {
  const { cafeId } = await requireCafeStaff(["OWNER"]);
  const [categories, items] = await Promise.all([
    prisma.menuCategory.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.menuItem.findMany({ where: { cafeId }, ...menuItemWithDish }),
  ]);
  return groupByCategory(categories, items);
}

/** Full menu (including unavailable items, greyed out client-side) for staff POS use. */
export async function listStaffMenu() {
  const { cafeId } = await requireCafeStaff(["OWNER", "WAITER"]);
  const [categories, items] = await Promise.all([
    prisma.menuCategory.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.menuItem.findMany({ where: { cafeId }, ...menuItemWithDish }),
  ]);
  return groupByCategory(categories, items);
}

export async function createMenuItem(input: unknown): Promise<ActionResult> {
  const { cafeId } = await requireCafeStaff(["OWNER"]);
  const parsed = menuItemSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Xatolik" };
  const { dishId, newDish, price, prepTimeMin, isAvailable } = parsed.data;

  let resolvedDishId = dishId ?? null;
  if (newDish) {
    const category = await prisma.menuCategory.findUnique({ where: { id: newDish.categoryId } });
    if (!category) return { ok: false, error: "Kategoriya topilmadi" };
    const created = await prisma.dishCatalog.create({
      data: {
        name: newDish.name,
        categoryId: newDish.categoryId,
        description: newDish.description || null,
        imageUrl: newDish.imageUrl || null,
        createdByCafeId: cafeId,
      },
    });
    resolvedDishId = created.id;
  } else {
    const dish = await prisma.dishCatalog.findUnique({ where: { id: resolvedDishId! } });
    if (!dish) return { ok: false, error: "Taom topilmadi" };
  }

  try {
    await prisma.menuItem.create({
      data: { cafeId, dishId: resolvedDishId!, price, prepTimeMin: prepTimeMin ?? null, isAvailable },
    });
  } catch {
    return { ok: false, error: "Bu taom allaqachon menyingizda bor" };
  }

  revalidatePath("/dashboard/owner/menu");
  revalidatePath("/[slug]", "page");
  return { ok: true, data: undefined };
}

/** Updates a cafe's own listing (price/prep time/availability) and, when provided, the shared dish's own fields. */
export async function updateMenuItem(id: string, input: unknown): Promise<ActionResult> {
  const { cafeId } = await requireCafeStaff(["OWNER"]);
  const parsed = menuItemSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Xatolik" };
  const { newDish, price, prepTimeMin, isAvailable } = parsed.data;

  const existing = await prisma.menuItem.findFirst({ where: { id, cafeId } });
  if (!existing) return { ok: false, error: "Taom topilmadi" };

  await prisma.$transaction(async (tx) => {
    await tx.menuItem.update({ where: { id }, data: { price, prepTimeMin: prepTimeMin ?? null, isAvailable } });
    if (newDish) {
      await tx.dishCatalog.update({
        where: { id: existing.dishId },
        data: {
          name: newDish.name,
          categoryId: newDish.categoryId,
          description: newDish.description || null,
          imageUrl: newDish.imageUrl || null,
        },
      });
    }
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
    },
  });
  if (!cafe) return null;

  const [categories, items] = await Promise.all([
    prisma.menuCategory.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.menuItem.findMany({ where: { cafeId: cafe.id, isAvailable: true }, ...menuItemWithDish }),
  ]);

  return {
    ...cafe,
    deliveryFee: Number(cafe.deliveryFee),
    minOrderTotal: Number(cafe.minOrderTotal),
    categories: groupByCategory(categories, items).filter((c) => c.items.length > 0),
  };
}

// ---------------------------------------------------------------------------
// Variants (unchanged — still per cafe MenuItem)
// ---------------------------------------------------------------------------

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
