"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { Plus, Trash2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { createTable, deleteTable } from "@/actions/tables";
import { cafeOrigin } from "@/lib/domain";

type TableRow = { id: string; label: string; qrToken: string; status: string };

function QrCard({ table, host, cafeSlug }: { table: TableRow; host: string; cafeSlug: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const url = `${cafeOrigin(cafeSlug, host)}?table=${table.qrToken}`;

  useEffect(() => {
    QRCode.toDataURL(url, { width: 220, margin: 1 }).then(setDataUrl);
  }, [url]);

  return (
    <div data-print-target className="flex flex-col items-center gap-2 p-4">
      <p className="text-lg font-bold">Stol {table.label}</p>
      {dataUrl && <img src={dataUrl} alt={`Stol ${table.label} QR`} width={220} height={220} />}
      <p className="max-w-[220px] break-all text-center text-[10px] text-muted-foreground">{url}</p>
    </div>
  );
}

export function OwnerTablesManager({ initialTables, cafeSlug }: { initialTables: TableRow[]; cafeSlug: string }) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [qrTable, setQrTable] = useState<TableRow | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const host = typeof window !== "undefined" ? window.location.host : "";

  function addTable() {
    startTransition(async () => {
      const result = await createTable({ label });
      if (result.ok) {
        setLabel("");
        setDialogOpen(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function removeTable(id: string) {
    startTransition(async () => {
      await deleteTable(id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger render={<Button size="sm" />}>
          <Plus className="size-4" /> Stol qo&apos;shish
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yangi stol</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 px-1">
            <Label htmlFor="label">Stol nomi/raqami</Label>
            <Input id="label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Masalan: 12" />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button disabled={pending || !label} onClick={addTable}>
              Saqlash
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {initialTables.map((table) => (
          <Card key={table.id}>
            <CardContent className="flex items-center justify-between gap-2 py-3">
              <div>
                <p className="font-semibold">Stol {table.label}</p>
                <p className="text-xs text-muted-foreground">{table.status}</p>
              </div>
              <div className="flex gap-1">
                <Button size="icon-sm" variant="outline" onClick={() => setQrTable(table)}>
                  <Printer className="size-3.5" />
                </Button>
                <Button size="icon-sm" variant="ghost" onClick={() => removeTable(table.id)}>
                  <Trash2 className="size-3.5 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!qrTable} onOpenChange={(open) => !open && setQrTable(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stol QR-kodi</DialogTitle>
          </DialogHeader>
          {qrTable && host && <QrCard table={qrTable} host={host} cafeSlug={cafeSlug} />}
          <DialogFooter>
            <Button onClick={() => window.print()}>
              <Printer className="size-4" /> Chop etish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
