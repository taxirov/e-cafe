"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { PhoneInput } from "@/components/phone-input";
import { inviteStaff, removeStaff } from "@/actions/staff";

type StaffRow = { id: string; fullName: string; phone: string; role: string };

const ROLE_LABELS: Record<string, string> = { WAITER: "Ofitsiant", KITCHEN: "Oshpaz" };

export function OwnerStaffManager({ initialStaff }: { initialStaff: StaffRow[] }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [role, setRole] = useState<"WAITER" | "KITCHEN">("WAITER");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await inviteStaff({
        fullName: String(formData.get("fullName") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        password: String(formData.get("password") ?? ""),
        role,
      });
      if (result.ok) {
        setDialogOpen(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      await removeStaff(id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger render={<Button size="sm" />}>
          <Plus className="size-4" /> Xodim qo&apos;shish
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yangi xodim</DialogTitle>
          </DialogHeader>
          <form action={submit} className="space-y-3 px-1">
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Ism</Label>
              <Input id="fullName" name="fullName" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Telefon</Label>
              <PhoneInput checkAvailability />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Parol</Label>
              <Input id="password" name="password" type="password" minLength={6} required />
            </div>
            <div className="space-y-1.5">
              <Label>Roli</Label>
              <Select value={role} onValueChange={(v) => setRole(v as "WAITER" | "KITCHEN")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WAITER">Ofitsiant</SelectItem>
                  <SelectItem value="KITCHEN">Oshpaz</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                Saqlash
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid gap-2 sm:grid-cols-2">
        {initialStaff.map((s) => (
          <Card key={s.id}>
            <CardContent className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">{s.fullName}</p>
                <p className="text-xs text-muted-foreground">{s.phone}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{ROLE_LABELS[s.role]}</Badge>
                <Button size="icon-sm" variant="ghost" onClick={() => remove(s.id)}>
                  <Trash2 className="size-3.5 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {initialStaff.length === 0 && <p className="text-sm text-muted-foreground">Xodimlar yo&apos;q</p>}
      </div>
    </div>
  );
}
