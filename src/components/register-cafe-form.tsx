"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { completeCafeRegistration } from "@/actions/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/phone-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function RegisterCafeForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await completeCafeRegistration({
        fullName: String(formData.get("fullName") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        password: String(formData.get("password") ?? ""),
        cafeName: String(formData.get("cafeName") ?? ""),
      });
      if (result) {
        setError(result);
        return;
      }
      router.refresh();
    });
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Kafe oching</CardTitle>
        <CardDescription>Kafeingizni ro&apos;yxatdan o&apos;tkazing va boshqarishni boshlang</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cafeName">Kafe nomi</Label>
            <Input id="cafeName" name="cafeName" required placeholder="Masalan: Javohir Cafe" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="fullName">Ismingiz</Label>
            <Input id="fullName" name="fullName" required placeholder="F.I.Sh" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telefon raqam</Label>
            <PhoneInput checkAvailability />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Parol</Label>
            <Input id="password" name="password" type="password" minLength={6} required />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Yaratilmoqda..." : "Kafe ochish"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Hisobingiz bormi?{" "}
          <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
            Kirish
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
