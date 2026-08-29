import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { placeGuestOrder } from "@/actions/orders";

/**
 * Public delivery-order creation for a single cafe, called from
 * e-mall.uz/cafe/{slug}. Wraps the same no-auth placeGuestOrder() the
 * cafe's own {slug}.e-cafe.uz ordering page uses — always forces
 * type: "DELIVERY" since e-mall never has a QR table token to offer
 * dine-in, and pickup isn't part of this integration.
 */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const cafe = await prisma.cafe.findUnique({ where: { slug, status: "ACTIVE" }, select: { id: true } });
    if (!cafe) return NextResponse.json({ error: "Cafe not found" }, { status: 404 });

    const body = await request.json();
    const result = await placeGuestOrder({ ...body, cafeId: cafe.id, type: "DELIVERY" });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json(result.data);
  } catch (err) {
    console.error("[api/public/cafes/[slug]/orders] failed", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
