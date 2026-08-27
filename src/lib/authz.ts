import { auth } from "@/auth";

export type AppRole = "SUPER_ADMIN" | "OWNER" | "WAITER" | "KITCHEN" | "CUSTOMER";

export class AuthzError extends Error {}

export async function requireRole(roles: AppRole[]) {
  const session = await auth();
  if (!session?.user) throw new AuthzError("Tizimga kirish talab qilinadi");
  if (!roles.includes(session.user.role as AppRole)) {
    throw new AuthzError("Ushbu amal uchun ruxsatingiz yo'q");
  }
  return session;
}

/** OWNER/WAITER/KITCHEN actions must be scoped to their own cafe. */
export async function requireCafeStaff(roles: AppRole[] = ["OWNER", "WAITER", "KITCHEN"]) {
  const session = await requireRole(roles);
  if (!session.user.cafeId) throw new AuthzError("Kafe topilmadi");
  return { session, cafeId: session.user.cafeId };
}
