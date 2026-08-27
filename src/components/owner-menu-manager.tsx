"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import {
  createMenuCategory,
  deleteMenuCategory,
  createMenuItem,
  updateMenuItem,
  toggleMenuItemAvailability,
  deleteMenuItem,
} from "@/actions/menu";
import { formatSom } from "@/lib/format";
import { useRouter } from "next/navigation";

type ItemRow = {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  price: unknown;
  isAvailable: boolean;
  prepTimeMin: number | null;
};
type CategoryRow = { id: string; name: string; items: ItemRow[] };

export function OwnerMenuManager({ initialCategories }: { initialCategories: CategoryRow[] }) {
  const router = useRouter();
  const [categoryName, setCategoryName] = useState("");
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [itemDialog, setItemDialog] = useState<{ categoryId: string; item?: ItemRow } | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function addCategory() {
    startTransition(async () => {
      const result = await createMenuCategory({ name: categoryName });
      if (result.ok) {
        setCategoryName("");
        setCategoryDialogOpen(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function removeCategory(id: string) {
    startTransition(async () => {
      await deleteMenuCategory(id);
      router.refresh();
    });
  }

  function submitItem(formData: FormData) {
    if (!itemDialog) return;
    const payload = {
      categoryId: String(formData.get("categoryId") ?? itemDialog.categoryId),
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? ""),
      price: Number(formData.get("price")),
      prepTimeMin: formData.get("prepTimeMin") ? Number(formData.get("prepTimeMin")) : null,
      isAvailable: formData.get("isAvailable") === "on",
    };
    startTransition(async () => {
      const result = itemDialog.item
        ? await updateMenuItem(itemDialog.item.id, payload)
        : await createMenuItem(payload);
      if (result.ok) {
        setItemDialog(null);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function removeItem(id: string) {
    startTransition(async () => {
      await deleteMenuItem(id);
      router.refresh();
    });
  }

  function toggleAvailable(id: string, value: boolean) {
    startTransition(async () => {
      await toggleMenuItemAvailability(id, value);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogTrigger render={<Button size="sm" />}>
          <Plus className="size-4" /> Kategoriya qo&apos;shish
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yangi kategoriya</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 px-1">
            <Label htmlFor="categoryName">Nomi</Label>
            <Input id="categoryName" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} placeholder="Masalan: Ichimliklar" />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button disabled={pending || !categoryName} onClick={addCategory}>
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {initialCategories.map((category) => (
        <section key={category.id} className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{category.name}</h2>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setItemDialog({ categoryId: category.id })}>
                <Plus className="size-4" /> Taom
              </Button>
              <Button size="icon-sm" variant="ghost" onClick={() => removeCategory(category.id)}>
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {category.items.map((item) => (
              <Card key={item.id}>
                <CardContent className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-brand">{formatSom(Number(item.price))} so&apos;m</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={item.isAvailable} onCheckedChange={(v) => toggleAvailable(item.id, v)} />
                    <Button size="icon-sm" variant="ghost" onClick={() => setItemDialog({ categoryId: category.id, item })}>
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button size="icon-sm" variant="ghost" onClick={() => removeItem(item.id)}>
                      <Trash2 className="size-3.5 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {category.items.length === 0 && <p className="text-sm text-muted-foreground">Taomlar yo&apos;q</p>}
          </div>
        </section>
      ))}

      <Dialog open={!!itemDialog} onOpenChange={(open) => !open && setItemDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{itemDialog?.item ? "Taomni tahrirlash" : "Yangi taom"}</DialogTitle>
          </DialogHeader>
          <form action={submitItem} className="space-y-3 px-1">
            <input type="hidden" name="categoryId" value={itemDialog?.categoryId} />
            <div className="space-y-1.5">
              <Label htmlFor="name">Nomi</Label>
              <Input id="name" name="name" defaultValue={itemDialog?.item?.name} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Tavsif</Label>
              <Textarea id="description" name="description" defaultValue={itemDialog?.item?.description ?? ""} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="price">Narx (so&apos;m)</Label>
                <Input id="price" name="price" type="number" min={0} step={500} defaultValue={itemDialog?.item ? Number(itemDialog.item.price) : undefined} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prepTimeMin">Tayyorlanish (daqiqa)</Label>
                <Input id="prepTimeMin" name="prepTimeMin" type="number" min={0} defaultValue={itemDialog?.item?.prepTimeMin ?? undefined} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="isAvailable" name="isAvailable" defaultChecked={itemDialog?.item?.isAvailable ?? true} />
              <Label htmlFor="isAvailable">Menyuda ko&apos;rinsin</Label>
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
    </div>
  );
}
