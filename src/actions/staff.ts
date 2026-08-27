"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCafeStaff } from "@/lib/authz";
import { hashPassword } from "@/lib/password";
import { inviteStaffSchema } from "@/lib/validations";
import type { ActionResult } from "./auth";

export async function listOwnerStaff() {
  const { cafeId } = await requireCafeStaff(["OWNER"]);
  return prisma.user.findMany({
    where: { cafeId, role: { in: ["WAITER", "KITCHEN"] } },
    select: { id: true, fullName: true, phone: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function inviteStaff(input: unknown): Promise<ActionResult> {
  const { cafeId } = await requireCafeStaff(["OWNER"]);
  const parsed = inviteStaffSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Xatolik" };
  const { fullName, phone, password, role } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) return { ok: false, error: "Bu telefon raqam bilan foydalanuvchi allaqachon ro'yxatdan o'tgan" };

  const passwordHash = await hashPassword(password);
  await prisma.user.create({ data: { cafeId, fullName, phone, passwordHash, role } });

  revalidatePath("/dashboard/owner/staff");
  return { ok: true, data: undefined };
}

export async function removeStaff(id: string): Promise<ActionResult> {
  const { cafeId } = await requireCafeStaff(["OWNER"]);
  await prisma.user.deleteMany({ where: { id, cafeId, role: { in: ["WAITER", "KITCHEN"] } } });
  revalidatePath("/dashboard/owner/staff");
  return { ok: true, data: undefined };
}
