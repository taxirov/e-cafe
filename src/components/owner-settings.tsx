"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateCafeIdentity, updateCafeContact } from "@/actions/cafes";

type Cafe = {
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  locationUrl: string | null;
  workingHours: string | null;
  contactPhone: string | null;
  instagramUrl: string | null;
  telegramUrl: string | null;
  deliveryFee: unknown;
  minOrderTotal: unknown;
};

export function OwnerSettings({ cafe }: { cafe: Cafe }) {
  const router = useRouter();
  const [identityPending, startIdentity] = useTransition();
  const [contactPending, startContact] = useTransition();
  const [identityError, setIdentityError] = useState<string | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);

  function submitIdentity(formData: FormData) {
    setIdentityError(null);
    startIdentity(async () => {
      const result = await updateCafeIdentity({
        name: String(formData.get("name") ?? ""),
        description: String(formData.get("description") ?? ""),
        slug: String(formData.get("slug") ?? ""),
      });
      if (!result.ok) setIdentityError(result.error);
      else router.refresh();
    });
  }

  function submitContact(formData: FormData) {
    setContactError(null);
    startContact(async () => {
      const result = await updateCafeContact({
        address: String(formData.get("address") ?? ""),
        locationUrl: String(formData.get("locationUrl") ?? ""),
        workingHours: String(formData.get("workingHours") ?? ""),
        contactPhone: String(formData.get("contactPhone") ?? ""),
        instagramUrl: String(formData.get("instagramUrl") ?? ""),
        telegramUrl: String(formData.get("telegramUrl") ?? ""),
        deliveryFee: Number(formData.get("deliveryFee") ?? 0),
        minOrderTotal: Number(formData.get("minOrderTotal") ?? 0),
      });
      if (!result.ok) setContactError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Kafe ma&apos;lumotlari</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={submitIdentity} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nomi</Label>
              <Input id="name" name="name" defaultValue={cafe.name} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slug">Havola (e-cafe.uz/...)</Label>
              <Input id="slug" name="slug" defaultValue={cafe.slug} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Tavsif</Label>
              <Textarea id="description" name="description" defaultValue={cafe.description ?? ""} rows={3} />
            </div>
            {identityError && <p className="text-sm text-destructive">{identityError}</p>}
            <Button type="submit" disabled={identityPending}>
              Saqlash
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Aloqa va yetkazib berish</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={submitContact} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="address">Manzil</Label>
              <Input id="address" name="address" defaultValue={cafe.address ?? ""} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="workingHours">Ish vaqti</Label>
              <Input id="workingHours" name="workingHours" defaultValue={cafe.workingHours ?? ""} placeholder="09:00 - 23:00" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contactPhone">Telefon (+998...)</Label>
              <Input id="contactPhone" name="contactPhone" defaultValue={cafe.contactPhone ?? ""} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="deliveryFee">Yetkazib berish narxi</Label>
                <Input id="deliveryFee" name="deliveryFee" type="number" min={0} defaultValue={Number(cafe.deliveryFee)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="minOrderTotal">Min. buyurtma summasi</Label>
                <Input id="minOrderTotal" name="minOrderTotal" type="number" min={0} defaultValue={Number(cafe.minOrderTotal)} />
              </div>
            </div>
            {contactError && <p className="text-sm text-destructive">{contactError}</p>}
            <Button type="submit" disabled={contactPending}>
              Saqlash
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
