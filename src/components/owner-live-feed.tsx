"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getStaffRealtimeToken, type SerializedOrder } from "@/actions/orders";
import { useRealtime } from "@/hooks/use-realtime";
import { formatSom, formatTime } from "@/lib/format";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Qabul qilindi",
  CONFIRMED: "Tasdiqlandi",
  PREPARING: "Tayyorlanmoqda",
  READY: "Tayyor",
  SERVED: "Yetkazildi",
  COMPLETED: "Yakunlandi",
  CANCELLED: "Bekor qilindi",
};
const TYPE_LABELS: Record<string, string> = { DINE_IN: "Stolda", DELIVERY: "Yetkazib berish", PICKUP: "Olib ketish" };

export function OwnerLiveFeed({ initialOrders }: { initialOrders: SerializedOrder[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    getStaffRealtimeToken().then(setToken);
  }, []);

  useRealtime(token, {
    "order:new": (payload) => setOrders((prev) => [payload as SerializedOrder, ...prev].slice(0, 30)),
    "order:updated": (payload) => {
      const order = payload as SerializedOrder;
      setOrders((prev) => prev.map((o) => (o.id === order.id ? order : o)));
    },
  });

  return (
    <div className="space-y-2">
      {orders.length === 0 && <p className="text-sm text-muted-foreground">Hozircha buyurtmalar yo&apos;q</p>}
      {orders.map((order) => (
        <Card key={order.id}>
          <CardContent className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="font-medium">
                {order.tableLabel ? `Stol ${order.tableLabel}` : order.customerName || `#${order.id.slice(-6)}`}
                <span className="ml-2 text-xs font-normal text-muted-foreground">{TYPE_LABELS[order.type]}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {order.items.length} ta taom · {formatSom(order.total)} so&apos;m · {formatTime(order.createdAt)}
              </p>
            </div>
            <Badge variant={order.status === "CANCELLED" ? "destructive" : "outline"}>{STATUS_LABELS[order.status]}</Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
