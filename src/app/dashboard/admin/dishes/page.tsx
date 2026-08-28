import { listAllDishes, listMenuCategories } from "@/actions/menu";
import { AdminDishesManager } from "@/components/admin-dishes-manager";

export default async function AdminDishesPage() {
  const [dishes, categories] = await Promise.all([listAllDishes(), listMenuCategories()]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Taomlar katalogi</h1>
      <p className="text-sm text-muted-foreground">
        Umumiy taomlar katalogi — barcha kafelar shu ro&apos;yxatdan tanlab, o&apos;z narxini qo&apos;yadi.
      </p>
      <AdminDishesManager initialDishes={dishes} categoryOptions={categories.map((c) => ({ id: c.id, name: c.name }))} />
    </div>
  );
}
