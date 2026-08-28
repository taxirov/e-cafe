"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ImageUpload } from "@/components/image-upload";
import { updateDish, deleteDish } from "@/actions/menu";

type DishRow = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  categoryId: string;
  categoryName: string;
  createdByCafeName: string | null;
  listedByCafes: number;
};
type CategoryOption = { id: string; name: string };

export function AdminDishesManager({
  initialDishes,
  categoryOptions,
}: {
  initialDishes: DishRow[];
  categoryOptions: CategoryOption[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<DishRow | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function remove(id: string) {
    setError(null);
    startTransition(async () => {
      const result = await deleteDish(id);
      if (!result.ok) setError(result.error);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {initialDishes.map((d) => (
          <Card key={d.id}>
            <CardContent className="flex items-center justify-between gap-3 py-3">
              <div className="flex min-w-0 items-center gap-3">
                {d.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={d.imageUrl} alt="" className="size-12 shrink-0 rounded-md object-cover" />
                )}
                <div className="min-w-0">
                  <p className="truncate font-medium">{d.name}</p>
                  <p className="text-xs text-muted-foreground">{d.categoryName}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.listedByCafes} ta kafeda{d.createdByCafeName ? ` · ${d.createdByCafeName} qo'shgan` : ""}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button size="icon-sm" variant="ghost" onClick={() => setEditing(d)}>
                  <Pencil className="size-3.5" />
                </Button>
                <Button size="icon-sm" variant="ghost" disabled={pending} onClick={() => remove(d.id)}>
                  <Trash2 className="size-3.5 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {initialDishes.length === 0 && <p className="text-sm text-muted-foreground">Taomlar yo&apos;q</p>}
      </div>

      {editing && (
        <EditDishDialog key={editing.id} dish={editing} categoryOptions={categoryOptions} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}

function EditDishDialog({
  dish,
  categoryOptions,
  onClose,
}: {
  dish: DishRow;
  categoryOptions: CategoryOption[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState(dish.categoryId);

  function submit(formData: FormData) {
    setError(null);
    const payload = {
      name: String(formData.get("name") ?? ""),
      categoryId: String(formData.get("categoryId") ?? ""),
      description: String(formData.get("description") ?? ""),
      imageUrl: String(formData.get("imageUrl") ?? ""),
    };
    startTransition(async () => {
      const result = await updateDish(dish.id, payload);
      if (result.ok) {
        onClose();
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Taomni tahrirlash</DialogTitle>
        </DialogHeader>
        <form action={submit} className="space-y-3 px-1">
          <ImageUpload name="imageUrl" defaultUrl={dish.imageUrl} label="Rasm (ixtiyoriy)" />
          <div className="space-y-1.5">
            <Label htmlFor="name">Nomi</Label>
            <Input id="name" name="name" defaultValue={dish.name} required />
          </div>
          <div className="space-y-1.5">
            <Label>Kategoriya</Label>
            <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? "")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" name="categoryId" value={categoryId} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Tavsif</Label>
            <Textarea id="description" name="description" defaultValue={dish.description ?? ""} rows={2} />
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
  );
}
