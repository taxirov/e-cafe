import { notFound } from "next/navigation";
import { getPublicMenu } from "@/actions/menu";
import { prisma } from "@/lib/prisma";
import { CafeOrderingClient } from "@/components/cafe-ordering-client";

export default async function CafePublicPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ table?: string }>;
}) {
  const { slug } = await params;
  const { table: tableToken } = await searchParams;

  const cafe = await getPublicMenu(slug);
  if (!cafe) notFound();

  const table = tableToken
    ? await prisma.cafeTable.findUnique({ where: { qrToken: tableToken }, select: { id: true, label: true, cafeId: true } })
    : null;
  const resolvedTable = table && table.cafeId === cafe.id ? table : null;

  return <CafeOrderingClient cafe={cafe} tableToken={tableToken} tableLabel={resolvedTable?.label ?? null} />;
}
