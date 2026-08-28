import { listOwnerMenu, listMenuCategories } from "@/actions/menu";
import { OwnerMenuManager } from "@/components/owner-menu-manager";

export default async function OwnerMenuPage() {
  const [categories, categoryOptions] = await Promise.all([listOwnerMenu(), listMenuCategories()]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Menyu</h1>
      <OwnerMenuManager
        initialCategories={categories}
        categoryOptions={categoryOptions.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
