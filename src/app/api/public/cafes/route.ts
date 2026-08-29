import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Public directory listing for other e-mall.uz-ecosystem apps (currently
 * e-mall.uz's homepage) to show active cafes alongside their own stores.
 * No auth — this is the same publicly-visible data a visitor sees on
 * {slug}.e-cafe.uz. Never fails loudly: a caller depends on this staying up
 * to render its own homepage, so any error still returns an empty list.
 */
export async function GET() {
  try {
    const cafes = await prisma.cafe.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 60,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logoUrl: true,
        bannerUrl: true,
        address: true,
        latitude: true,
        longitude: true,
        serviceRadiusKm: true,
        servicePolygon: true,
      },
    });
    return NextResponse.json({ cafes });
  } catch (err) {
    console.error("[api/public/cafes] failed", err);
    return NextResponse.json({ cafes: [] });
  }
}
