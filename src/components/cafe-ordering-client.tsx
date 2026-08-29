"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingCart, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PhoneInput } from "@/components/phone-input";
import { LocationPicker } from "@/components/location-picker";
import { placeGuestOrder } from "@/actions/orders";
import { formatSom } from "@/lib/format";

type MenuVariant = { id: string; name: string; price: unknown };
type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: unknown;
  imageUrl: string | null;
  variants: MenuVariant[];
};
type PublicCafe = {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  workingHours: string | null;
  deliveryFee: unknown;
  minOrderTotal: unknown;
  categories: { id: string; name: string; items: MenuItem[] }[];
};

type OrderType = "DINE_IN" | "DELIVERY" | "PICKUP";

/** Cart is keyed by menuItemId, or `${menuItemId}::${variantId}` when the item has variants. */
function cartKey(itemId: string, variantId?: string | null) {
  return variantId ? `${itemId}::${variantId}` : itemId;
}

export function CafeOrderingClient({
  cafe,
  tableToken,
  tableLabel,
}: {
  cafe: PublicCafe;
  tableToken?: string;
  tableLabel: string | null;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<OrderType>(tableLabel ? "DINE_IN" : "DELIVERY");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [variantPickerItem, setVariantPickerItem] = useState<MenuItem | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const allItems = useMemo(() => cafe.categories.flatMap((c) => c.items), [cafe.categories]);
  const itemsById = useMemo(() => new Map(allItems.map((i) => [i.id, i])), [allItems]);

  const cartLines = Object.entries(cart)
    .filter(([, qty]) => qty > 0)
    .map(([key, qty]) => {
      const [itemId, variantId] = key.split("::");
      const item = itemsById.get(itemId);
      const variant = variantId ? item?.variants.find((v) => v.id === variantId) : undefined;
      return { key, item, variant, qty };
    })
    .filter((l): l is typeof l & { item: MenuItem } => Boolean(l.item));

  const linePrice = (item: MenuItem, variant?: MenuVariant) => Number(variant ? variant.price : item.price);

  const subtotal = cartLines.reduce((sum, l) => sum + linePrice(l.item, l.variant) * l.qty, 0);
  const deliveryFee = mode === "DELIVERY" ? Number(cafe.deliveryFee) : 0;
  const total = subtotal + deliveryFee;
  const cartCount = cartLines.reduce((sum, l) => sum + l.qty, 0);

  function addToCart(key: string, delta: number) {
    setCart((prev) => ({ ...prev, [key]: Math.max(0, (prev[key] ?? 0) + delta) }));
  }

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await placeGuestOrder({
        cafeId: cafe.id,
        type: mode,
        tableToken: mode === "DINE_IN" ? tableToken : null,
        items: cartLines.map((l) => ({ menuItemId: l.item.id, variantId: l.variant?.id ?? null, qty: l.qty })),
        customerName: formData.get("customerName") ? String(formData.get("customerName")) : null,
        customerPhone: formData.get("phone") ? String(formData.get("phone")) : null,
        address: formData.get("address") ? String(formData.get("address")) : null,
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
        note: formData.get("note") ? String(formData.get("note")) : null,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/order/${result.data.orderId}`);
    });
  }

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-2xl flex-col pb-24">
      <div className="border-b bg-muted/20 px-4 py-5">
        <h1 className="text-2xl font-bold">{cafe.name}</h1>
        {cafe.description && <p className="mt-1 text-sm text-muted-foreground">{cafe.description}</p>}
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
          {cafe.address && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" /> {cafe.address}
            </span>
          )}
          {cafe.workingHours && (
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" /> {cafe.workingHours}
            </span>
          )}
        </div>

        {tableLabel ? (
          <Badge className="mt-3">Stol: {tableLabel}</Badge>
        ) : (
          <Tabs value={mode} onValueChange={(v) => setMode(v as OrderType)} className="mt-3">
            <TabsList>
              <TabsTrigger value="DELIVERY">Yetkazib berish</TabsTrigger>
              <TabsTrigger value="PICKUP">Olib ketish</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </div>

      <div className="flex-1 space-y-6 px-4 py-5">
        {cafe.categories.map((category) => (
          <section key={category.id}>
            <h2 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">{category.name}</h2>
            <div className="space-y-2">
              {category.items.map((item) => {
                const hasVariants = item.variants.length > 0;
                const key = cartKey(item.id);
                const qty = hasVariants ? 0 : (cart[key] ?? 0);
                const itemCartQty = hasVariants
                  ? item.variants.reduce((sum, v) => sum + (cart[cartKey(item.id, v.id)] ?? 0), 0)
                  : qty;

                return (
                  <Card key={item.id}>
                    <CardContent className="flex items-center justify-between gap-3 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        {item.imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.imageUrl} alt="" className="size-14 shrink-0 rounded-md object-cover" />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium">{item.name}</p>
                          {item.description && <p className="truncate text-sm text-muted-foreground">{item.description}</p>}
                          <p className="mt-1 text-sm font-semibold text-brand">
                            {hasVariants
                              ? `${formatSom(Math.min(...item.variants.map((v) => Number(v.price))))} so'mdan`
                              : `${formatSom(Number(item.price))} so'm`}
                          </p>
                        </div>
                      </div>

                      {hasVariants ? (
                        <Button size="sm" variant={itemCartQty > 0 ? "default" : "outline"} onClick={() => setVariantPickerItem(item)}>
                          {itemCartQty > 0 ? `Tanlangan (${itemCartQty})` : "Tanlash"}
                        </Button>
                      ) : qty === 0 ? (
                        <Button size="sm" onClick={() => addToCart(key, 1)}>
                          Qo&apos;shish
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Button size="icon-sm" variant="outline" onClick={() => addToCart(key, -1)}>
                            <Minus className="size-3.5" />
                          </Button>
                          <span className="w-4 text-center text-sm font-medium">{qty}</span>
                          <Button size="icon-sm" variant="outline" onClick={() => addToCart(key, 1)}>
                            <Plus className="size-3.5" />
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {cartCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 mx-auto max-w-2xl border-t bg-background p-3">
          <Button className="w-full" size="lg" onClick={() => setCartOpen(true)}>
            <ShoppingCart className="size-4" />
            Savat ({cartCount}) — {formatSom(subtotal)} so&apos;m
          </Button>
        </div>
      )}

      <Dialog open={!!variantPickerItem} onOpenChange={(open) => !open && setVariantPickerItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{variantPickerItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 px-1">
            {variantPickerItem?.variants.map((v) => {
              const key = cartKey(variantPickerItem.id, v.id);
              const vQty = cart[key] ?? 0;
              return (
                <div key={v.id} className="flex items-center justify-between gap-3 rounded-lg border p-2.5">
                  <div>
                    <p className="text-sm font-medium">{v.name}</p>
                    <p className="text-xs text-brand">{formatSom(Number(v.price))} so&apos;m</p>
                  </div>
                  {vQty === 0 ? (
                    <Button size="sm" variant="outline" onClick={() => addToCart(key, 1)}>
                      Qo&apos;shish
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button size="icon-sm" variant="outline" onClick={() => addToCart(key, -1)}>
                        <Minus className="size-3.5" />
                      </Button>
                      <span className="w-4 text-center text-sm font-medium">{vQty}</span>
                      <Button size="icon-sm" variant="outline" onClick={() => addToCart(key, 1)}>
                        <Plus className="size-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto sm:max-w-2xl sm:mx-auto">
          <SheetHeader>
            <SheetTitle>Buyurtmani tasdiqlash</SheetTitle>
          </SheetHeader>
          <form action={submit} className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
            <div className="space-y-2">
              {cartLines.map((l) => (
                <div key={l.key} className="flex items-center justify-between text-sm">
                  <span>
                    {l.item.name}
                    {l.variant ? ` (${l.variant.name})` : ""} × {l.qty}
                  </span>
                  <span className="font-medium">{formatSom(linePrice(l.item, l.variant) * l.qty)} so&apos;m</span>
                </div>
              ))}
              {mode === "DELIVERY" && deliveryFee > 0 && (
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Yetkazib berish</span>
                  <span>{formatSom(deliveryFee)} so&apos;m</span>
                </div>
              )}
              <div className="flex items-center justify-between border-t pt-2 text-base font-semibold">
                <span>Jami</span>
                <span>{formatSom(total)} so&apos;m</span>
              </div>
            </div>

            {mode !== "DINE_IN" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="customerName">Ismingiz</Label>
                  <Input id="customerName" name="customerName" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefon raqam</Label>
                  <PhoneInput />
                </div>
                {mode === "DELIVERY" && (
                  <div className="space-y-2">
                    <Label htmlFor="address">Manzil</Label>
                    <Textarea id="address" name="address" required rows={2} />
                    <LocationPicker value={coords} onChange={setCoords} height={200} />
                  </div>
                )}
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="note">Izoh (ixtiyoriy)</Label>
              <Textarea id="note" name="note" rows={2} placeholder="Masalan: achchiq bo'lmasin" />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <SheetFooter className="p-0">
              <Button type="submit" size="lg" disabled={pending || cartLines.length === 0}>
                {pending ? "Yuborilmoqda..." : `Buyurtma berish — ${formatSom(total)} so'm`}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
