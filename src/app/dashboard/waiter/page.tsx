import { listOwnerTables } from "@/actions/tables";
import { listStaffMenu } from "@/actions/menu";
import { listCafeOrdersSerialized } from "@/actions/orders";
import { requireCafeStaff } from "@/lib/authz";
import { prisma } from "@/lib/prisma";
import { WaiterPos } from "@/components/waiter-pos";

export default async function WaiterPage() {
  const { cafeId } = await requireCafeStaff(["WAITER", "OWNER"]);

  const [tables, categories, orders, cafe] = await Promise.all([
    listOwnerTables(),
    listStaffMenu(),
    listCafeOrdersSerialized(["PENDING", "CONFIRMED", "PREPARING", "READY", "SERVED"]),
    prisma.cafe.findUniqueOrThrow({ where: { id: cafeId }, select: { name: true } }),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Stollar / POS</h1>
      <WaiterPos
        initialTables={tables.map((t) => ({ id: t.id, label: t.label, status: t.status }))}
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          items: c.items.map((i) => ({
            id: i.id,
            name: i.name,
            price: i.price,
            isAvailable: i.isAvailable,
            variants: i.variants.map((v) => ({ id: v.id, name: v.name, price: v.price })),
          })),
        }))}
        initialOrders={orders}
        cafeName={cafe.name}
      />
    </div>
  );
}
