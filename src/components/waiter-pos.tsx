"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Minus, Plus, Bell, Check, Receipt as ReceiptIcon, Printer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { getStaffRealtimeToken, placeStaffOrder, updateOrderStatus, completeOrder, type SerializedOrder } from "@/actions/orders";
import { useRealtime } from "@/hooks/use-realtime";
import { formatSom } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Receipt } from "@/components/receipt";

type PaymentMethod = "CASH" | "CARD";

type TableRow = { id: string; label: string; status: "FREE" | "OCCUPIED" | "RESERVED" };
type MenuCategoryRow = {
  id: string;
  name: string;
  items: { id: string; name: string; price: unknown; isAvailable: boolean }[];
};

const STATUS_STYLES: Record<string, string> = {
  FREE: "border-border bg-card",
  OCCUPIED: "border-brand bg-brand-muted",
  RESERVED: "border-blue-400 bg-blue-50 dark:bg-blue-950/30",
};

const STATUS_LABELS: Record<string, string> = { FREE: "Bo'sh", OCCUPIED: "Band", RESERVED: "Bron" };

export function WaiterPos({
  initialTables,
  categories,
  initialOrders,
  cafeName,
}: {
  initialTables: TableRow[];
  categories: MenuCategoryRow[];
  initialOrders: SerializedOrder[];
  cafeName: string;
}) {
  const [tables, setTables] = useState(initialTables);
  const [orders, setOrders] = useState(initialOrders);
  const [token, setToken] = useState<string | null>(null);
  const [activeTable, setActiveTable] = useState<TableRow | null>(null);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [pending, startTransition] = useTransition();
  const [checkoutOrder, setCheckoutOrder] = useState<SerializedOrder | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<SerializedOrder | null>(null);

  useEffect(() => {
    getStaffRealtimeToken().then(setToken);
  }, []);

  useRealtime(token, {
    "table:updated": (payload) => {
      const { id, status } = payload as { id: string; status: TableRow["status"] };
      setTables((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    },
    "order:new": (payload) => setOrders((prev) => [payload as SerializedOrder, ...prev]),
    "order:updated": (payload) => {
      const order = payload as SerializedOrder;
      setOrders((prev) => {
        const withoutDone = prev.filter((o) => o.id !== order.id);
        return ["COMPLETED", "CANCELLED"].includes(order.status) ? withoutDone : [order, ...withoutDone];
      });
    },
  });

  const allItems = useMemo(() => categories.flatMap((c) => c.items), [categories]);
  const itemsById = useMemo(() => new Map(allItems.map((i) => [i.id, i])), [allItems]);
  const cartLines = Object.entries(cart)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => ({ item: itemsById.get(id)!, qty }))
    .filter((l) => l.item);
  const total = cartLines.reduce((sum, l) => sum + Number(l.item.price) * l.qty, 0);

  const readyOrders = orders.filter((o) => o.status === "READY" && o.type === "DINE_IN");
  // Dine-in orders wait to be physically served; delivery/pickup orders are
  // considered handed over as soon as they're ready, so they're payable right away.
  const completableOrders = orders.filter((o) => o.status === "SERVED" || (o.status === "READY" && o.type !== "DINE_IN"));
  const tableOrderCount = (tableId: string) =>
    orders.filter((o) => o.tableId === tableId && o.status !== "SERVED").length;

  function openTable(table: TableRow) {
    setActiveTable(table);
    setCart({});
  }

  function addToCart(id: string, delta: number) {
    setCart((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] ?? 0) + delta) }));
  }

  function submitOrder() {
    if (!activeTable) return;
    startTransition(async () => {
      const result = await placeStaffOrder({
        tableId: activeTable.id,
        items: cartLines.map((l) => ({ menuItemId: l.item.id, qty: l.qty })),
      });
      if (result.ok) {
        setActiveTable(null);
        setCart({});
      }
    });
  }

  function serve(orderId: string) {
    startTransition(async () => {
      await updateOrderStatus(orderId, "SERVED");
    });
  }

  function pay(paymentMethod: PaymentMethod) {
    if (!checkoutOrder) return;
    startTransition(async () => {
      const result = await completeOrder(checkoutOrder.id, paymentMethod);
      setCheckoutOrder(null);
      if (result.ok) setReceiptOrder(result.data);
    });
  }

  return (
    <div className="space-y-6">
      {readyOrders.length > 0 && (
        <div className="space-y-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            <Bell className="size-4" /> Tayyor — olib boring
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {readyOrders.map((order) => (
              <Card key={order.id} className="border-l-4 border-l-emerald-500">
                <CardContent className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{order.tableLabel ? `Stol ${order.tableLabel}` : `#${order.id.slice(-6)}`}</p>
                    <p className="text-xs text-muted-foreground">{order.items.length} ta taom</p>
                  </div>
                  <Button size="sm" disabled={pending} onClick={() => serve(order.id)}>
                    <Check className="size-4" /> Berildi
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {completableOrders.length > 0 && (
        <div className="space-y-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            <ReceiptIcon className="size-4" /> To&apos;lovni yakunlash
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {completableOrders.map((order) => (
              <Card key={order.id} className="border-l-4 border-l-amber-500">
                <CardContent className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{order.tableLabel ? `Stol ${order.tableLabel}` : `#${order.id.slice(-6)}`}</p>
                    <p className="text-xs text-muted-foreground">{order.items.length} ta taom · {formatSom(order.total)} so&apos;m</p>
                  </div>
                  <Button size="sm" variant="outline" disabled={pending} onClick={() => setCheckoutOrder(order)}>
                    Hisob-kitob
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Stollar</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {tables.map((table) => {
            const count = tableOrderCount(table.id);
            return (
              <button
                key={table.id}
                onClick={() => openTable(table)}
                className={cn("relative flex aspect-square flex-col items-center justify-center rounded-xl border-2 text-center transition-colors", STATUS_STYLES[table.status])}
              >
                <span className="text-lg font-bold">{table.label}</span>
                <span className="text-xs text-muted-foreground">{STATUS_LABELS[table.status]}</span>
                {count > 0 && (
                  <Badge className="absolute -top-2 -right-2" variant="default">
                    {count}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <Sheet open={!!activeTable} onOpenChange={(open) => !open && setActiveTable(null)}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto sm:max-w-2xl sm:mx-auto">
          <SheetHeader>
            <SheetTitle>Stol {activeTable?.label} — yangi buyurtma</SheetTitle>
          </SheetHeader>
          <div className="flex-1 space-y-6 overflow-y-auto px-4">
            {categories.map((category) => (
              <section key={category.id}>
                <h3 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">{category.name}</h3>
                <div className="space-y-2">
                  {category.items.filter((i) => i.isAvailable).map((item) => {
                    const qty = cart[item.id] ?? 0;
                    return (
                      <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border p-2.5">
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-brand">{formatSom(Number(item.price))} so&apos;m</p>
                        </div>
                        {qty === 0 ? (
                          <Button size="sm" variant="outline" onClick={() => addToCart(item.id, 1)}>
                            Qo&apos;shish
                          </Button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Button size="icon-sm" variant="outline" onClick={() => addToCart(item.id, -1)}>
                              <Minus className="size-3.5" />
                            </Button>
                            <span className="w-4 text-center text-sm font-medium">{qty}</span>
                            <Button size="icon-sm" variant="outline" onClick={() => addToCart(item.id, 1)}>
                              <Plus className="size-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
          <SheetFooter>
            <Button size="lg" disabled={pending || cartLines.length === 0} onClick={submitOrder}>
              {pending ? "Yuborilmoqda..." : `Oshxonaga yuborish — ${formatSom(total)} so'm`}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={!!checkoutOrder} onOpenChange={(open) => !open && setCheckoutOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {checkoutOrder?.tableLabel ? `Stol ${checkoutOrder.tableLabel}` : `#${checkoutOrder?.id.slice(-6)}`} —{" "}
              {checkoutOrder ? formatSom(checkoutOrder.total) : 0} so&apos;m
            </DialogTitle>
          </DialogHeader>
          <p className="px-1 text-sm text-muted-foreground">To&apos;lov usulini tanlang</p>
          <DialogFooter>
            <Button variant="outline" disabled={pending} onClick={() => pay("CASH")}>
              Naqd
            </Button>
            <Button disabled={pending} onClick={() => pay("CARD")}>
              Karta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!receiptOrder} onOpenChange={(open) => !open && setReceiptOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chek</DialogTitle>
          </DialogHeader>
          {receiptOrder && <Receipt order={receiptOrder} cafeName={cafeName} />}
          <DialogFooter>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="size-4" /> Chop etish
            </Button>
            <Button onClick={() => setReceiptOrder(null)}>Yopish</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
