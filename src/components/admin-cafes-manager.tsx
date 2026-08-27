"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { setCafeStatus } from "@/actions/cafes";
import { formatDateTime } from "@/lib/format";

type CafeRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt: Date | string;
  owner: { fullName: string; phone: string };
  _count: { tables: number; staff: number };
};

const STATUS_LABELS: Record<string, string> = { PENDING: "Kutilmoqda", ACTIVE: "Faol", SUSPENDED: "To'xtatilgan" };

export function AdminCafesManager({ initialCafes }: { initialCafes: CafeRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function setStatus(id: string, status: "ACTIVE" | "SUSPENDED" | "PENDING") {
    startTransition(async () => {
      await setCafeStatus(id, status);
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      {initialCafes.map((cafe) => (
        <Card key={cafe.id}>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div>
              <p className="font-medium">
                {cafe.name} <span className="text-xs font-normal text-muted-foreground">/{cafe.slug}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {cafe.owner.fullName} · {cafe.owner.phone} · {cafe._count.tables} stol · {cafe._count.staff} xodim
              </p>
              <p className="text-xs text-muted-foreground">{formatDateTime(cafe.createdAt)}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={cafe.status === "ACTIVE" ? "default" : cafe.status === "SUSPENDED" ? "destructive" : "outline"}>
                {STATUS_LABELS[cafe.status]}
              </Badge>
              {cafe.status !== "ACTIVE" && (
                <Button size="sm" disabled={pending} onClick={() => setStatus(cafe.id, "ACTIVE")}>
                  Tasdiqlash
                </Button>
              )}
              {cafe.status !== "SUSPENDED" && (
                <Button size="sm" variant="outline" disabled={pending} onClick={() => setStatus(cafe.id, "SUSPENDED")}>
                  To&apos;xtatish
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
      {initialCafes.length === 0 && <p className="text-sm text-muted-foreground">Kafelar yo&apos;q</p>}
    </div>
  );
}
