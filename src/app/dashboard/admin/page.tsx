import { listCafesForAdmin } from "@/actions/cafes";
import { AdminCafesManager } from "@/components/admin-cafes-manager";

export default async function AdminPage() {
  const cafes = await listCafesForAdmin();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Kafelar</h1>
      <AdminCafesManager initialCafes={cafes} />
    </div>
  );
}
