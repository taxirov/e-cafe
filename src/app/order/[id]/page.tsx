import { notFound } from "next/navigation";
import { getGuestOrder } from "@/actions/orders";
import { OrderTracker } from "@/components/order-tracker";

export default async function OrderTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getGuestOrder(id);
  if (!order) notFound();

  return <OrderTracker initialOrder={order} />;
}
