import Link from "next/link";
import { UtensilsCrossed, QrCode, ChefHat, Radio, Coffee, Pizza, Soup, Sandwich } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="relative z-10 flex items-center justify-between border-b px-6 py-4">
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

      <main className="relative isolate flex flex-1 flex-col items-center overflow-hidden">
        {/* Decorative hero background */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div
            className="absolute inset-0 opacity-[0.4] dark:opacity-[0.25]"
            style={{
              backgroundImage:
                "radial-gradient(color-mix(in oklch, var(--color-brand) 35%, transparent) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
              maskImage: "radial-gradient(ellipse 70% 60% at 50% 0%, black 40%, transparent 100%)",
              WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 0%, black 40%, transparent 100%)",
            }}
          />
          <div className="absolute -top-32 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-brand/25 blur-3xl" />
          <div className="absolute top-20 -left-24 h-72 w-72 rounded-full bg-brand/15 blur-3xl" />
          <div className="absolute top-10 -right-20 h-72 w-72 rounded-full bg-brand-muted blur-3xl" />

          <Coffee className="absolute top-24 left-[8%] size-14 -rotate-12 text-brand/15 sm:size-20" />
          <Pizza className="absolute top-16 right-[10%] size-16 rotate-12 text-brand/15 sm:size-24" />
          <Soup className="absolute bottom-8 left-[14%] size-12 rotate-6 text-brand/15 sm:size-16" />
          <Sandwich className="absolute right-[16%] bottom-4 size-14 -rotate-6 text-brand/15 sm:size-20" />
        </div>

        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-10 px-6 py-16 text-center">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Kafe va restoranlar uchun <span className="text-brand">tezkor</span> buyurtma tizimi
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              QR-stol orqali mijoz o&apos;zi buyurtma beradi, ofitsiant kassadan kiritadi, oshxona ekranida darhol
              ko&apos;radi — hammasi bir zumda yangilanadi.
            </p>
            <Button size="lg" render={<Link href="/register" />} nativeButton={false}>
              Bepul boshlash
            </Button>
          </div>

          <div className="grid w-full gap-4 sm:grid-cols-3">
            <Card className="bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <QrCode className="size-6 text-brand" />
                <CardTitle className="text-base">QR-stol buyurtma</CardTitle>
                <CardDescription>Mijoz stoldagi QR-kodni skanerlab, telefonidan menyuni ko&apos;rib buyurtma beradi.</CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <ChefHat className="size-6 text-brand" />
                <CardTitle className="text-base">Oshxona ekrani</CardTitle>
                <CardDescription>Yangi buyurtmalar oshpazga darhol tushadi — qog&apos;ozsiz.</CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <Radio className="size-6 text-brand" />
                <CardTitle className="text-base">Bir zumda yangilanish</CardTitle>
                <CardDescription>Stol, buyurtma va oshxona holati barcha ekranlarda darhol yangilanib turadi.</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
