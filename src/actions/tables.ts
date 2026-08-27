"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireCafeStaff } from "@/lib/authz";
import { tableSchema } from "@/lib/validations";
import { broadcastToCafe } from "@/lib/realtime";
import type { ActionResult } from "./auth";

export async function listOwnerTables() {
  const { cafeId } = await requireCafeStaff(["OWNER", "WAITER"]);
  return prisma.cafeTable.findMany({ where: { cafeId }, orderBy: { createdAt: "asc" } });
}

export async function createTable(input: unknown): Promise<ActionResult> {
  const { cafeId } = await requireCafeStaff(["OWNER"]);
  const parsed = tableSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Xatolik" };

  const existing = await prisma.cafeTable.findFirst({ where: { cafeId, label: parsed.data.label } });
  if (existing) return { ok: false, error: "Bu nomdagi stol allaqachon mavjud" };

  await prisma.cafeTable.create({ data: { cafeId, label: parsed.data.label } });
  revalidatePath("/dashboard/owner/tables");
  return { ok: true, data: undefined };
}

export async function deleteTable(id: string): Promise<ActionResult> {
  const { cafeId } = await requireCafeStaff(["OWNER"]);
  await prisma.cafeTable.deleteMany({ where: { id, cafeId } });
  revalidatePath("/dashboard/owner/tables");
  return { ok: true, data: undefined };
}

export async function setTableStatus(id: string, status: "FREE" | "OCCUPIED" | "RESERVED"): Promise<ActionResult> {
  const { cafeId } = await requireCafeStaff(["OWNER", "WAITER"]);
  const table = await prisma.cafeTable.findFirst({ where: { id, cafeId } });
  if (!table) return { ok: false, error: "Stol topilmadi" };

  await prisma.cafeTable.update({ where: { id }, data: { status } });
  await broadcastToCafe(cafeId, "table:updated", { id, status });
  revalidatePath("/dashboard/owner/tables");
  revalidatePath("/dashboard/waiter");
  return { ok: true, data: undefined };
}
