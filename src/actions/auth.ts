"use server";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { registerCafeSchema, phoneSchema, NAME_CHARS_REGEX, NAME_CHARS_HINT } from "@/lib/validations";
import { slugify, isReservedSlug } from "@/lib/domain";
import { broadcastToAdmins } from "@/lib/realtime";

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

export async function checkPhoneAvailable(phone: unknown): Promise<ActionResult> {
  const parsed = phoneSchema.safeParse(phone);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Noto'g'ri raqam" };

  const existing = await prisma.user.findUnique({ where: { phone: parsed.data } });
  if (existing) return { ok: false, error: "Bu telefon raqam bilan foydalanuvchi allaqachon ro'yxatdan o'tgan" };
  return { ok: true, data: undefined };
}

export type NameAvailability = { status: "available" } | { status: "taken" } | { status: "invalid"; message: string };

export async function checkCafeNameAvailable(name: unknown): Promise<NameAvailability> {
  const trimmed = typeof name === "string" ? name.trim() : "";
  if (trimmed.length < 2) return { status: "invalid", message: "Kafe nomi kamida 2 ta belgidan iborat bo'lishi kerak" };
  if (!NAME_CHARS_REGEX.test(trimmed)) return { status: "invalid", message: NAME_CHARS_HINT };

  const slug = slugify(trimmed);
  if (!slug || isReservedSlug(slug)) return { status: "taken" };

  const existing = await prisma.cafe.findFirst({
    where: { OR: [{ slug }, { name: { equals: trimmed, mode: "insensitive" } }] },
    select: { id: true },
  });
  return existing ? { status: "taken" } : { status: "available" };
}

export async function registerCafe(input: unknown): Promise<ActionResult<{ cafeSlug: string }>> {
  const parsed = registerCafeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Noto'g'ri ma'lumot" };
  const { fullName, phone, password, cafeName } = parsed.data;

  const existingUser = await prisma.user.findUnique({ where: { phone } });
  if (existingUser) return { ok: false, error: "Bu telefon raqam bilan foydalanuvchi allaqachon ro'yxatdan o'tgan" };

  const baseSlug = slugify(cafeName) || "kafe";
  let slug = baseSlug;
  let suffix = 1;
  while (isReservedSlug(slug) || (await prisma.cafe.findUnique({ where: { slug } }))) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  const passwordHash = await hashPassword(password);

  const cafe = await prisma.$transaction(async (tx) => {
    const owner = await tx.user.create({ data: { phone, passwordHash, fullName, role: "OWNER" } });
    const newCafe = await tx.cafe.create({ data: { name: cafeName, slug, ownerId: owner.id } });
    await tx.user.update({ where: { id: owner.id }, data: { cafeId: newCafe.id } });
    return newCafe;
  });

  await broadcastToAdmins("cafe:new", { id: cafe.id, name: cafe.name });

  return { ok: true, data: { cafeSlug: slug } };
}
