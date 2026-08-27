import { listCafeOrdersSerialized } from "@/actions/orders";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatSom, formatDateTime } from "@/lib/format";

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
const PAYMENT_LABELS: Record<string, string> = { CASH: "Naqd", CARD: "Karta", ONLINE: "Onlayn" };

export default async function OwnerOrdersPage() {
  const orders = await listCafeOrdersSerialized();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Buyurtmalar tarixi</h1>
      <div className="space-y-2">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardContent className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="font-medium">
                  {order.tableLabel ? `Stol ${order.tableLabel}` : order.customerName || `#${order.id.slice(-6)}`}
                  <span className="ml-2 text-xs font-normal text-muted-foreground">{TYPE_LABELS[order.type]}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {order.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}
                </p>
                <p className="text-xs text-muted-foreground">{formatDateTime(order.createdAt)}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge variant={order.status === "CANCELLED" ? "destructive" : "outline"}>{STATUS_LABELS[order.status]}</Badge>
                <span className="text-sm font-semibold">{formatSom(order.total)} so&apos;m</span>
                {order.paymentMethod && (
                  <span className="text-xs text-muted-foreground">{PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {orders.length === 0 && <p className="text-sm text-muted-foreground">Buyurtmalar yo&apos;q</p>}
      </div>
    </div>
  );
}
