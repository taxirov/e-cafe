"use client";

import { useEffect, useState, useTransition } from "react";
import { Plus, Trash2, Pencil, Layers, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ImageUpload } from "@/components/image-upload";
import {
  createMenuItem,
  updateMenuItem,
  toggleMenuItemAvailability,
  deleteMenuItem,
  createMenuItemVariant,
  updateMenuItemVariant,
  deleteMenuItemVariant,
  searchDishCatalog,
} from "@/actions/menu";
import { formatSom } from "@/lib/format";
import { useRouter } from "next/navigation";

type VariantRow = { id: string; name: string; price: unknown };
type ItemRow = {
  id: string;
  dishId: string;
  categoryId: string;
  name: string;
  description: string | null;
  price: unknown;
  imageUrl: string | null;
  isAvailable: boolean;
  prepTimeMin: number | null;
  variants: VariantRow[];
};
type CategoryRow = { id: string; name: string; items: ItemRow[] };
type CategoryOption = { id: string; name: string };
type DishHit = { id: string; name: string; description: string | null; imageUrl: string | null; categoryId: string; categoryName: string };

function priceLabel(item: ItemRow): string {
  if (item.variants.length === 0) return `${formatSom(Number(item.price))} so'm`;
  const prices = item.variants.map((v) => Number(v.price));
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? `${formatSom(min)} so'm` : `${formatSom(min)}–${formatSom(max)} so'm`;
}

export function OwnerMenuManager({
  initialCategories,
  categoryOptions,
}: {
  initialCategories: CategoryRow[];
  categoryOptions: CategoryOption[];
}) {
  const router = useRouter();
  const [itemDialog, setItemDialog] = useState<{ item?: ItemRow; presetCategoryId?: string } | null>(null);
  const [variantDialog, setVariantDialog] = useState<ItemRow | null>(null);
  const [, startTransition] = useTransition();

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
      {initialCategories.map((category) => (
        <section key={category.id} className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{category.name}</h2>
            <Button size="sm" variant="outline" onClick={() => setItemDialog({ presetCategoryId: category.id })}>
              <Plus className="size-4" /> Taom
            </Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {category.items.map((item) => (
              <Card key={item.id}>
                <CardContent className="flex items-center justify-between gap-3 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {item.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt="" className="size-12 shrink-0 rounded-md object-cover" />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-brand">{priceLabel(item)}</p>
                      {item.variants.length > 0 && (
                        <p className="text-xs text-muted-foreground">{item.variants.length} ta variant</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Switch checked={item.isAvailable} onCheckedChange={(v) => toggleAvailable(item.id, v)} />
                    <Button size="icon-sm" variant="ghost" onClick={() => setVariantDialog(item)} title="Variantlar">
                      <Layers className="size-3.5" />
                    </Button>
                    <Button size="icon-sm" variant="ghost" onClick={() => setItemDialog({ item })}>
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

      {itemDialog && (
        <ItemDialog
          key={itemDialog.item?.id ?? `new-${itemDialog.presetCategoryId}`}
          item={itemDialog.item}
          presetCategoryId={itemDialog.presetCategoryId}
          categoryOptions={categoryOptions}
          onClose={() => setItemDialog(null)}
        />
      )}

      <VariantsDialog item={variantDialog} onClose={() => setVariantDialog(null)} />
    </div>
  );
}

function ItemDialog({
  item,
  presetCategoryId,
  categoryOptions,
  onClose,
}: {
  item?: ItemRow;
  presetCategoryId?: string;
  categoryOptions: CategoryOption[];
  onClose: () => void;
}) {
  const router = useRouter();
  const isEdit = !!item;
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Create flow: search an existing dish, or fall back to defining a new one.
  const [mode, setMode] = useState<"pick" | "create">("pick");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DishHit[]>([]);
  const [selectedDish, setSelectedDish] = useState<DishHit | null>(null);
  const [searching, setSearching] = useState(false);

  // Shared dish fields (used both for "create new" and for editing an existing item's dish).
  const [name, setName] = useState(item?.name ?? "");
  const [categoryId, setCategoryId] = useState(item?.categoryId ?? presetCategoryId ?? categoryOptions[0]?.id ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const imageUrl = item?.imageUrl ?? "";

  useEffect(() => {
    if (isEdit || mode !== "pick" || query.trim().length < 2) return;
    let cancelled = false;
    const timeout = setTimeout(async () => {
      setSearching(true);
      const hits = await searchDishCatalog(query);
      if (!cancelled) {
        setResults(hits);
        setSearching(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query, mode, isEdit]);

  const visibleResults = !isEdit && mode === "pick" && query.trim().length >= 2 ? results : [];

  function submit(formData: FormData) {
    setError(null);
    const price = Number(formData.get("price"));
    const prepTimeMin = formData.get("prepTimeMin") ? Number(formData.get("prepTimeMin")) : null;
    const isAvailable = formData.get("isAvailable") === "on";

    const payload =
      !isEdit && mode === "pick" && selectedDish
        ? { dishId: selectedDish.id, price, prepTimeMin, isAvailable }
        : {
            newDish: {
              name: String(formData.get("name") ?? ""),
              categoryId: String(formData.get("categoryId") ?? ""),
              description: String(formData.get("description") ?? ""),
              imageUrl: String(formData.get("imageUrl") ?? ""),
            },
            price,
            prepTimeMin,
            isAvailable,
          };

    startTransition(async () => {
      const result = isEdit ? await updateMenuItem(item!.id, payload) : await createMenuItem(payload);
      if (result.ok) {
        onClose();
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  const needsNewDishFields = isEdit || mode === "create";

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Taomni tahrirlash" : "Yangi taom"}</DialogTitle>
        </DialogHeader>
        <form action={submit} className="space-y-3 px-1">
          {!isEdit && (
            <div className="space-y-2">
              <div className="flex gap-1 rounded-lg bg-muted p-1 text-sm">
                <button
                  type="button"
                  onClick={() => setMode("pick")}
                  className={`flex-1 rounded-md py-1.5 font-medium transition-colors ${mode === "pick" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
                >
                  Mavjud taomdan
                </button>
                <button
                  type="button"
                  onClick={() => setMode("create")}
                  className={`flex-1 rounded-md py-1.5 font-medium transition-colors ${mode === "create" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
                >
                  Yangi taom
                </button>
              </div>

              {mode === "pick" && !selectedDish && (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="pl-8"
                      placeholder="Taom nomini qidiring..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </div>
                  {searching && <p className="text-xs text-muted-foreground">Qidirilmoqda...</p>}
                  {visibleResults.length > 0 && (
                    <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border p-1">
                      {visibleResults.map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => setSelectedDish(d)}
                          className="flex w-full items-center gap-2 rounded-md p-1.5 text-left text-sm hover:bg-muted"
                        >
                          {d.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={d.imageUrl} alt="" className="size-8 rounded object-cover" />
                          ) : (
                            <div className="size-8 rounded bg-muted" />
                          )}
                          <div className="min-w-0">
                            <p className="truncate font-medium">{d.name}</p>
                            <p className="text-xs text-muted-foreground">{d.categoryName}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {!searching && query.trim().length >= 2 && visibleResults.length === 0 && (
                    <p className="text-xs text-muted-foreground">Topilmadi — &quot;Yangi taom&quot;ni tanlang</p>
                  )}
                </div>
              )}

              {mode === "pick" && selectedDish && (
                <div className="flex items-center justify-between gap-2 rounded-lg border p-2">
                  <div className="flex items-center gap-2">
                    {selectedDish.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={selectedDish.imageUrl} alt="" className="size-10 rounded object-cover" />
                    ) : (
                      <div className="size-10 rounded bg-muted" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{selectedDish.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedDish.categoryName}</p>
                    </div>
                  </div>
                  <Button size="icon-sm" variant="ghost" type="button" onClick={() => setSelectedDish(null)}>
                    <X className="size-3.5" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {needsNewDishFields && (
            <>
              <ImageUpload name="imageUrl" defaultUrl={imageUrl} label="Taom rasmi (ixtiyoriy)" />
              <div className="space-y-1.5">
                <Label htmlFor="name">Nomi {isEdit && <span className="text-xs text-muted-foreground">(barcha kafelar uchun umumiy)</span>}</Label>
                <Input id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} required />
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
                <Textarea id="description" name="description" value={description ?? ""} onChange={(e) => setDescription(e.target.value)} rows={2} />
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="price">
                Narx (so&apos;m){item?.variants.length ? " — variant yo'qligida ishlatiladi" : ""}
              </Label>
              <Input id="price" name="price" type="number" min={0} step={500} defaultValue={item ? Number(item.price) : undefined} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prepTimeMin">Tayyorlanish (daqiqa)</Label>
              <Input id="prepTimeMin" name="prepTimeMin" type="number" min={0} defaultValue={item?.prepTimeMin ?? undefined} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="isAvailable" name="isAvailable" defaultChecked={item?.isAvailable ?? true} />
            <Label htmlFor="isAvailable">Menyuda ko&apos;rinsin</Label>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={pending || (!isEdit && mode === "pick" && !selectedDish)}>
              Saqlash
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function VariantsDialog({ item, onClose }: { item: ItemRow | null; onClose: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<VariantRow | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  function reset() {
    setEditing(null);
    setName("");
    setPrice("");
    setError(null);
  }

  function startEdit(v: VariantRow) {
    setEditing(v);
    setName(v.name);
    setPrice(String(Number(v.price)));
  }

  function save() {
    if (!item) return;
    const payload = { name, price: Number(price) };
    startTransition(async () => {
      const result = editing
        ? await updateMenuItemVariant(editing.id, payload)
        : await createMenuItemVariant(item.id, payload);
      if (result.ok) {
        reset();
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      await deleteMenuItemVariant(id);
      if (editing?.id === id) reset();
      router.refresh();
    });
  }

  return (
    <Dialog
      open={!!item}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
          reset();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item?.name} — variantlar</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 px-1">
          <p className="text-xs text-muted-foreground">
            Masalan: &quot;Kichik&quot; / &quot;Katta&quot;. Variant qo&apos;shilsa, mijoz buyurtma berishda albatta bittasini tanlaydi.
          </p>
          {item?.variants.map((v) => (
            <div key={v.id} className="flex items-center justify-between gap-2 rounded-lg border p-2">
              <div>
                <p className="text-sm font-medium">{v.name}</p>
                <p className="text-xs text-brand">{formatSom(Number(v.price))} so&apos;m</p>
              </div>
              <div className="flex gap-1">
                <Button size="icon-sm" variant="ghost" onClick={() => startEdit(v)}>
                  <Pencil className="size-3.5" />
                </Button>
                <Button size="icon-sm" variant="ghost" onClick={() => remove(v.id)}>
                  <Trash2 className="size-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
          {(!item || item.variants.length === 0) && <p className="text-sm text-muted-foreground">Hali variant yo&apos;q</p>}
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-2 border-t px-1 pt-3">
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Nomi (Kichik)" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="Narx" type="number" min={0} step={500} value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <Button disabled={pending || !name || !price} onClick={save}>
            {editing ? "Yangilash" : "Qo'shish"}
          </Button>
        </div>
        {editing && (
          <button type="button" onClick={reset} className="px-1 text-left text-xs text-muted-foreground underline underline-offset-2">
            Bekor qilish
          </button>
        )}
        {error && <p className="px-1 text-sm text-destructive">{error}</p>}
      </DialogContent>
    </Dialog>
  );
}
