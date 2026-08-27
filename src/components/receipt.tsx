import { formatDateTime, formatSom } from "@/lib/format";
import type { SerializedOrder } from "@/actions/orders";

const TYPE_LABELS: Record<string, string> = { DINE_IN: "Stolda", DELIVERY: "Yetkazib berish", PICKUP: "Olib ketish" };
const PAYMENT_LABELS: Record<string, string> = { CASH: "Naqd", CARD: "Karta", ONLINE: "Onlayn" };

export function Receipt({ order, cafeName }: { order: SerializedOrder; cafeName: string }) {
  return (
    <div data-print-target className="mx-auto w-full max-w-xs space-y-3 p-4 font-mono text-sm">
      <div className="text-center">
        <p className="text-base font-bold">{cafeName}</p>
        <p className="text-xs text-muted-foreground">
          {order.tableLabel ? `Stol ${order.tableLabel}` : TYPE_LABELS[order.type]}
        </p>
        <p className="text-xs text-muted-foreground">#{order.id.slice(-6).toUpperCase()} · {formatDateTime(order.updatedAt)}</p>
      </div>

      <div className="border-t border-dashed" />

      <div className="space-y-1">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between gap-2">
            <span>
              {item.name} × {item.qty}
            </span>
            <span>{formatSom(item.price * item.qty)}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-dashed" />

      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Taomlar</span>
          <span>{formatSom(order.subtotal)}</span>
        </div>
        {order.deliveryFee > 0 && (
          <div className="flex justify-between">
            <span>Yetkazib berish</span>
            <span>{formatSom(order.deliveryFee)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-bold">
          <span>Jami</span>
          <span>{formatSom(order.total)} so&apos;m</span>
        </div>
        {order.paymentMethod && (
          <div className="flex justify-between text-muted-foreground">
            <span>To&apos;lov</span>
            <span>{PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}</span>
          </div>
        )}
      </div>

      <p className="pt-2 text-center text-xs text-muted-foreground">Xarid uchun rahmat!</p>
    </div>
  );
}
