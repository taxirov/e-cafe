import Link from "next/link";
import { UtensilsCrossed, QrCode, ChefHat, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-2 font-semibold text-brand">
          <UtensilsCrossed className="size-5" />
          e-cafe.uz
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" render={<Link href="/login" />} nativeButton={false}>
            Kirish
          </Button>
          <Button render={<Link href="/register" />} nativeButton={false}>Kafe ochish</Button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-10 px-6 py-16 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Kafe va restoranlar uchun <span className="text-brand">real vaqtli</span> buyurtma tizimi
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            QR-stol orqali mijoz o&apos;zi buyurtma beradi, ofitsiant POS&apos;dan kiritadi, oshxona ekranida darhol
            ko&apos;radi — barchasi websocket orqali bir zumda sinxron.
          </p>
          <Button size="lg" render={<Link href="/register" />} nativeButton={false}>
            Bepul boshlash
          </Button>
        </div>

        <div className="grid w-full gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <QrCode className="size-6 text-brand" />
              <CardTitle className="text-base">QR-stol buyurtma</CardTitle>
              <CardDescription>Mijoz stoldagi QR-kodni skanerlab, telefonidan menyuni ko&apos;rib buyurtma beradi.</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <ChefHat className="size-6 text-brand" />
              <CardTitle className="text-base">Oshxona ekrani</CardTitle>
              <CardDescription>Yangi buyurtmalar oshpazga darhol, real vaqtda tushadi — qog&apos;ozsiz.</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Radio className="size-6 text-brand" />
              <CardTitle className="text-base">To&apos;liq realtime</CardTitle>
              <CardDescription>Websocket orqali stol, buyurtma va oshxona holati barcha ekranlarda bir zumda yangilanadi.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    </div>
  );
}
