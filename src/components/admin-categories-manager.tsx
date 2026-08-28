"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { createMenuCategory, deleteMenuCategory } from "@/actions/menu";

type CategoryRow = { id: string; name: string };

export function AdminCategoriesManager({ initialCategories }: { initialCategories: CategoryRow[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function add() {
    setError(null);
    startTransition(async () => {
      const result = await createMenuCategory({ name });
      if (result.ok) {
        setName("");
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const result = await deleteMenuCategory(id);
      if (!result.ok) setError(result.error);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex max-w-sm gap-2">
        <Input placeholder="Masalan: Ichimliklar" value={name} onChange={(e) => setName(e.target.value)} />
        <Button disabled={pending || !name} onClick={add}>
          <Plus className="size-4" /> Qo&apos;shish
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {initialCategories.map((c) => (
          <Card key={c.id}>
            <CardContent className="flex items-center justify-between py-3">
              <p className="font-medium">{c.name}</p>
              <Button size="icon-sm" variant="ghost" onClick={() => remove(c.id)}>
                <Trash2 className="size-3.5 text-destructive" />
              </Button>
            </CardContent>
          </Card>
        ))}
        {initialCategories.length === 0 && <p className="text-sm text-muted-foreground">Kategoriyalar yo&apos;q</p>}
      </div>
    </div>
  );
}
