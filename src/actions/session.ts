"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { registerCafe, type ActionResult } from "./auth";

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}

function dashboardPathFor(role?: string) {
  if (role === "SUPER_ADMIN") return "/dashboard/admin";
  if (role === "OWNER") return "/dashboard/owner";
  if (role === "WAITER") return "/dashboard/waiter";
  if (role === "KITCHEN") return "/dashboard/kitchen";
  return "/login";
}

export async function authenticate(_prevState: string | undefined, formData: FormData) {
  const phone = formData.get("phone") as string;

  try {
    await signIn("credentials", {
      phone,
      password: formData.get("password"),
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return "Telefon raqam yoki parol noto'g'ri";
    }
    throw error;
  }

  const user = await prisma.user.findUnique({ where: { phone }, select: { role: true } });
  redirect(dashboardPathFor(user?.role));
}

async function signInWithCredentials(phone: string, password: string) {
  await signIn("credentials", { phone, password, redirect: false });
}

export async function completeCafeRegistration(input: {
  fullName: string;
  phone: string;
  password: string;
  cafeName: string;
}): Promise<string | undefined> {
  const result: ActionResult<{ cafeSlug: string }> = await registerCafe(input);
  if (!result.ok) return result.error;

  await signInWithCredentials(input.phone, input.password);
  redirect("/dashboard/owner");
}
