import { prisma } from "@/lib/prisma";
import { requireCafeStaff } from "@/lib/authz";
import { listCafeOrdersSerialized } from "@/actions/orders";
import { OwnerLiveFeed } from "@/components/owner-live-feed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatSom } from "@/lib/format";

export default async function OwnerOverviewPage() {
  const { cafeId } = await requireCafeStaff(["OWNER"]);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [orders, todayOrders, tableCount, menuItemCount] = await Promise.all([
    listCafeOrdersSerialized(),
    prisma.order.findMany({ where: { cafeId, createdAt: { gte: todayStart }, status: { not: "CANCELLED" } }, select: { total: true } }),
    prisma.cafeTable.count({ where: { cafeId } }),
    prisma.menuItem.count({ where: { cafeId } }),
  ]);

  const todayRevenue = todayOrders.reduce((sum, o) => sum + Number(o.total), 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Umumiy ko&apos;rinish</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bugungi savdo</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{formatSom(todayRevenue)} so&apos;m</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bugungi buyurtmalar</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{todayOrders.length}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Stollar / Menyu</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {tableCount} / {menuItemCount}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Jonli lenta</h2>
        <OwnerLiveFeed initialOrders={orders.slice(0, 30)} />
      </div>
    </div>
  );
}
