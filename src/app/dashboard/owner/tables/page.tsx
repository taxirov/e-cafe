import { listOwnerTables } from "@/actions/tables";
import { getOwnerCafe } from "@/actions/cafes";
import { OwnerTablesManager } from "@/components/owner-tables-manager";

export default async function OwnerTablesPage() {
  const [tables, cafe] = await Promise.all([listOwnerTables(), getOwnerCafe()]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Stollar / QR-kodlar</h1>
      <OwnerTablesManager
        initialTables={tables.map((t) => ({ id: t.id, label: t.label, qrToken: t.qrToken, status: t.status }))}
        cafeSlug={cafe.slug}
      />
    </div>
  );
}
