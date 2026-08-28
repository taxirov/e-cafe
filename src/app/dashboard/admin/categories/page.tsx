import { listMenuCategories } from "@/actions/menu";
import { AdminCategoriesManager } from "@/components/admin-categories-manager";

export default async function AdminCategoriesPage() {
  const categories = await listMenuCategories();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Menyu kategoriyalari</h1>
      <p className="text-sm text-muted-foreground">
        Bu kategoriyalar barcha kafelar uchun umumiy — har bir kafe taom qo&apos;shishda shulardan tanlaydi.
      </p>
      <AdminCategoriesManager initialCategories={categories} />
    </div>
  );
}
