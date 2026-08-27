"use client";

import { useEffect, useState, useTransition } from "react";
import { Clock, ChefHat, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getStaffRealtimeToken, updateOrderStatus, type SerializedOrder } from "@/actions/orders";
import { useRealtime } from "@/hooks/use-realtime";
import { formatTime } from "@/lib/format";

const ACTIVE_STATUSES = ["PENDING", "CONFIRMED", "PREPARING", "READY"];

const TYPE_LABELS: Record<string, string> = { DINE_IN: "Stolda", DELIVERY: "Yetkazib berish", PICKUP: "Olib ketish" };

export function KitchenBoard({ initialOrders }: { initialOrders: SerializedOrder[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [token, setToken] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    getStaffRealtimeToken().then(setToken);
  }, []);

  useRealtime(token, {
    "order:new": (payload) => {
      const order = payload as SerializedOrder;
      setOrders((prev) => [order, ...prev.filter((o) => o.id !== order.id)]);
    },
    "order:updated": (payload) => {
      const order = payload as SerializedOrder;
      setOrders((prev) => {
        if (!ACTIVE_STATUSES.includes(order.status)) return prev.filter((o) => o.id !== order.id);
        return prev.map((o) => (o.id === order.id ? order : o));
      });
    },
  });

  function advance(orderId: string, next: string) {
    startTransition(async () => {
      await updateOrderStatus(orderId, next as never);
    });
  }

  const columns = [
    { key: "NEW", label: "Yangi", orders: orders.filter((o) => o.status === "PENDING" || o.status === "CONFIRMED"), next: "PREPARING", nextLabel: "Boshlash", icon: Clock },
    { key: "PREPARING", label: "Tayyorlanmoqda", orders: orders.filter((o) => o.status === "PREPARING"), next: "READY", nextLabel: "Tayyor", icon: ChefHat },
    { key: "READY", label: "Tayyor", orders: orders.filter((o) => o.status === "READY"), next: "SERVED", nextLabel: "Yetkazildi", icon: Bell },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {columns.map((col) => (
        <div key={col.key} className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            <col.icon className="size-4" /> {col.label} ({col.orders.length})
          </h2>
          <div className="space-y-3">
            {col.orders.map((order) => (
              <Card key={order.id} className="border-l-4 border-l-brand">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {order.tableLabel ? `Stol ${order.tableLabel}` : `#${order.id.slice(-6).toUpperCase()}`}
                    </CardTitle>
                    <Badge variant="outline">{TYPE_LABELS[order.type]}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{formatTime(order.createdAt)}</p>
                </CardHeader>
                <CardContent className="space-y-2 pb-3">
                  <ul className="space-y-1 text-sm">
                    {order.items.map((item) => (
                      <li key={item.id}>
                        <span className="font-medium">{item.qty}×</span> {item.name}
                        {item.note && <span className="text-muted-foreground"> ({item.note})</span>}
                      </li>
                    ))}
                  </ul>
                  {order.note && <p className="text-xs text-muted-foreground">Izoh: {order.note}</p>}
                  <Button size="sm" className="w-full" disabled={pending} onClick={() => advance(order.id, col.next)}>
                    {col.nextLabel}
                  </Button>
                </CardContent>
              </Card>
            ))}
            {col.orders.length === 0 && <p className="text-sm text-muted-foreground">Bo&apos;sh</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
