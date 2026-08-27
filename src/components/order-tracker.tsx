"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Circle, ChefHat, Bell, PartyPopper, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getGuestOrderRealtimeToken, type SerializedOrder } from "@/actions/orders";
import { useRealtime } from "@/hooks/use-realtime";
import { formatSom, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const STEPS: { status: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { status: "PENDING", label: "Qabul qilindi", icon: Circle },
  { status: "CONFIRMED", label: "Tasdiqlandi", icon: CheckCircle2 },
  { status: "PREPARING", label: "Tayyorlanmoqda", icon: ChefHat },
  { status: "READY", label: "Tayyor", icon: Bell },
  { status: "SERVED", label: "Yetkazildi", icon: PartyPopper },
];

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Qabul qilindi",
  CONFIRMED: "Tasdiqlandi",
  PREPARING: "Tayyorlanmoqda",
  READY: "Tayyor",
  SERVED: "Yetkazildi",
  COMPLETED: "Yakunlandi",
  CANCELLED: "Bekor qilindi",
};

export function OrderTracker({ initialOrder }: { initialOrder: SerializedOrder }) {
  const [order, setOrder] = useState(initialOrder);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    getGuestOrderRealtimeToken(initialOrder.id).then(setToken);
  }, [initialOrder.id]);

  useRealtime(token, {
    "order:updated": (payload) => {
      const updated = payload as SerializedOrder;
      if (updated.id === order.id) setOrder(updated);
    },
  });

  // COMPLETED is the post-SERVED closeout (payment collected) — visually still "fully served".
  const effectiveStatus = order.status === "COMPLETED" ? "SERVED" : order.status;
  const stepIndex = STEPS.findIndex((s) => s.status === effectiveStatus);
  const cancelled = order.status === "CANCELLED";

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md flex-col gap-4 px-4 py-8">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Buyurtma</p>
        <h1 className="text-lg font-semibold">#{order.id.slice(-6).toUpperCase()}</h1>
        {order.tableLabel && <p className="text-sm text-muted-foreground">Stol: {order.tableLabel}</p>}
      </div>

      {cancelled ? (
        <Card className="border-destructive/30">
          <CardContent className="flex items-center gap-3 py-6">
            <XCircle className="size-6 text-destructive" />
            <p className="font-medium text-destructive">Buyurtma bekor qilindi</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-6">
            <ol className="space-y-4">
              {STEPS.map((step, i) => {
                const done = i <= stepIndex;
                const Icon = step.icon;
                return (
                  <li key={step.status} className="flex items-center gap-3">
                    <Icon className={cn("size-5 shrink-0", done ? "text-brand" : "text-muted-foreground/40")} />
                    <span className={cn("text-sm", done ? "font-medium text-foreground" : "text-muted-foreground")}>
                      {step.label}
                    </span>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="space-y-2 py-4">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <span>
                {item.name} × {item.qty}
              </span>
              <span className="font-medium">{formatSom(item.price * item.qty)} so&apos;m</span>
            </div>
          ))}
          <div className="flex items-center justify-between border-t pt-2 text-base font-semibold">
            <span>Jami</span>
            <span>{formatSom(order.total)} so&apos;m</span>
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        Holat: {STATUS_LABELS[order.status] ?? order.status} · {formatTime(order.updatedAt)}
      </p>
    </div>
  );
}
