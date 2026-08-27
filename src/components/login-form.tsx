"use client";

import { useActionState } from "react";
import Link from "next/link";
import { authenticate } from "@/actions/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/phone-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function LoginForm() {
  const [error, formAction, pending] = useActionState(authenticate, undefined);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Tizimga kirish</CardTitle>
        <CardDescription>Telefon raqam va parolingizni kiriting</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Telefon raqam</Label>
            <PhoneInput />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Parol</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Kirilmoqda..." : "Kirish"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Kafeingiz yo&apos;qmi?{" "}
          <Link href="/register" className="font-medium text-foreground underline underline-offset-4">
            Kafe oching
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
