"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Menu,
  LayoutDashboard,
  UtensilsCrossed,
  Users,
  ClipboardList,
  Settings,
  LogOut,
  Grid2x2,
  ChefHat,
  Building2,
  Tags,
  Utensils,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { signOutAction } from "@/actions/session";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };

const NAV_ITEMS: Record<string, NavItem[]> = {
  SUPER_ADMIN: [
    { href: "/dashboard/admin", label: "Kafelar", icon: Building2 },
    { href: "/dashboard/admin/categories", label: "Kategoriyalar", icon: Tags },
    { href: "/dashboard/admin/dishes", label: "Taomlar katalogi", icon: Utensils },
  ],
  OWNER: [
    { href: "/dashboard/owner", label: "Umumiy ko'rinish", icon: LayoutDashboard },
    { href: "/dashboard/owner/menu", label: "Menyu", icon: UtensilsCrossed },
    { href: "/dashboard/owner/tables", label: "Stollar / QR", icon: Grid2x2 },
    { href: "/dashboard/owner/staff", label: "Xodimlar", icon: Users },
    { href: "/dashboard/owner/orders", label: "Buyurtmalar", icon: ClipboardList },
    { href: "/dashboard/waiter", label: "Stollar / POS", icon: Grid2x2 },
    { href: "/dashboard/kitchen", label: "Oshxona ekrani", icon: ChefHat },
    { href: "/dashboard/owner/settings", label: "Sozlamalar", icon: Settings },
  ],
  WAITER: [{ href: "/dashboard/waiter", label: "Stollar / POS", icon: Grid2x2 }],
  KITCHEN: [{ href: "/dashboard/kitchen", label: "Oshxona ekrani", icon: ChefHat }],
};

export function DashboardShell({
  role,
  cafeName,
  userName,
  children,
}: {
  role: string;
  cafeName?: string | null;
  userName: string;
  children: React.ReactNode;
}) {
  const items = NAV_ITEMS[role] ?? [];
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active ? "bg-brand text-brand-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-svh flex-col md:flex-row">
      <aside className="hidden w-56 shrink-0 border-r bg-muted/20 p-4 md:sticky md:top-0 md:flex md:h-svh md:flex-col">
        <div className="mb-6 flex items-center gap-2 font-semibold text-brand">
          <UtensilsCrossed className="size-5" />
          e-cafe.uz
        </div>
        {cafeName && <p className="mb-4 truncate text-xs text-muted-foreground">{cafeName}</p>}
        {nav}
        <form action={signOutAction} className="mt-auto pt-4">
          <Button type="submit" variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground">
            <LogOut className="size-4" />
            Chiqish
          </Button>
        </form>
      </aside>

      <header className="flex items-center justify-between border-b p-3 md:hidden">
        <div className="flex items-center gap-2 font-semibold text-brand">
          <UtensilsCrossed className="size-5" />
          e-cafe.uz
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger render={<Button variant="outline" size="icon" />}>
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-4">
            <SheetTitle className="mb-4">{cafeName ?? userName}</SheetTitle>
            {nav}
            <form action={signOutAction} className="mt-4">
              <Button type="submit" variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground">
                <LogOut className="size-4" />
                Chiqish
              </Button>
            </form>
          </SheetContent>
        </Sheet>
      </header>

      <main className="flex-1 p-4 sm:p-6">{children}</main>
    </div>
  );
}
