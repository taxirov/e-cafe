import { NextResponse } from "next/server";
import { getPublicMenu } from "@/actions/menu";

/**
 * Public menu for a single cafe — same data/shape `getPublicMenu` already
 * serves to {slug}.e-cafe.uz's own ordering page, exposed here so
 * e-mall.uz's /cafe/{slug} page can render the same menu without touching
 * this app's database directly.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const menu = await getPublicMenu(slug);
    if (!menu) return NextResponse.json({ error: "Cafe not found" }, { status: 404 });
    return NextResponse.json(menu);
  } catch (err) {
    console.error("[api/public/cafes/[slug]/menu] failed", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
