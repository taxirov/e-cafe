"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { requireRole, requireCafeStaff } from "@/lib/authz";
import { updateCafeIdentitySchema, updateCafeContactSchema } from "@/lib/validations";
import { isReservedSlug } from "@/lib/domain";
import { broadcastToCafe } from "@/lib/realtime";
import type { ActionResult } from "./auth";

export async function listCafesForAdmin() {
  await requireRole(["SUPER_ADMIN"]);
  return prisma.cafe.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      createdAt: true,
      owner: { select: { fullName: true, phone: true } },
      _count: { select: { tables: true, staff: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function setCafeStatus(cafeId: string, status: "ACTIVE" | "SUSPENDED" | "PENDING"): Promise<ActionResult> {
  await requireRole(["SUPER_ADMIN"]);
  const cafe = await prisma.cafe.update({ where: { id: cafeId }, data: { status } });
  await broadcastToCafe(cafe.id, "cafe:status", { status });
  revalidatePath("/dashboard/admin");
  return { ok: true, data: undefined };
}

export async function getOwnerCafe() {
  const { cafeId } = await requireCafeStaff(["OWNER"]);
  const cafe = await prisma.cafe.findUniqueOrThrow({ where: { id: cafeId } });
  return { ...cafe, deliveryFee: Number(cafe.deliveryFee), minOrderTotal: Number(cafe.minOrderTotal) };
}

export async function updateCafeIdentity(input: unknown): Promise<ActionResult<{ slug: string }>> {
  const session = await requireRole(["OWNER"]);
  const cafeId = session.user.cafeId;
  if (!cafeId) return { ok: false, error: "Kafe topilmadi" };

  const parsed = updateCafeIdentitySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Xatolik" };
  const { name, description, slug, logoUrl, bannerUrl } = parsed.data;

  if (isReservedSlug(slug)) return { ok: false, error: "Bu manzil band, boshqasini tanlang" };

  const existing = await prisma.cafe.findUnique({ where: { slug } });
  if (existing && existing.id !== cafeId) return { ok: false, error: "Bu manzil allaqachon band" };

  await prisma.cafe.update({
    where: { id: cafeId },
    data: { name, description: description || null, slug, logoUrl: logoUrl || null, bannerUrl: bannerUrl || null },
  });

  revalidatePath("/dashboard/owner/settings");
  revalidatePath(`/${slug}`);
  return { ok: true, data: { slug } };
}

export async function updateCafeContact(input: unknown): Promise<ActionResult> {
  const session = await requireRole(["OWNER"]);
  const cafeId = session.user.cafeId;
  if (!cafeId) return { ok: false, error: "Kafe topilmadi" };

  const parsed = updateCafeContactSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Xatolik" };
  const {
    address,
    latitude,
    longitude,
    serviceRadiusKm,
    servicePolygon,
    locationUrl,
    workingHours,
    contactPhone,
    instagramUrl,
    telegramUrl,
    deliveryFee,
    minOrderTotal,
    useEcourier,
  } = parsed.data;

  await prisma.cafe.update({
    where: { id: cafeId },
    data: {
      address: address || null,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      serviceRadiusKm: serviceRadiusKm ?? null,
      servicePolygon: servicePolygon ?? Prisma.JsonNull,
      locationUrl: locationUrl || null,
      workingHours: workingHours || null,
      contactPhone: contactPhone || null,
      instagramUrl: instagramUrl || null,
      telegramUrl: telegramUrl || null,
      deliveryFee,
      minOrderTotal,
      useEcourier,
    },
  });

  revalidatePath("/dashboard/owner/settings");
  return { ok: true, data: undefined };
}
