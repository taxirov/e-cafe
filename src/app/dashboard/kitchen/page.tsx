import { listCafeOrdersSerialized } from "@/actions/orders";
import { KitchenBoard } from "@/components/kitchen-board";

export default async function KitchenPage() {
  const orders = await listCafeOrdersSerialized(["PENDING", "CONFIRMED", "PREPARING", "READY"]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Oshxona ekrani</h1>
      <KitchenBoard initialOrders={orders} />
    </div>
  );
}
