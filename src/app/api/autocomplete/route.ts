import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const watches = await prisma.watch.findMany({
    where: { userId: session.user.id },
    select: {
      brand: true,
      caseMaterial: true,
      condition: true,
      purchaseSource: true,
      salePlatform: true,
    },
  });

  const unique = (arr: (string | null)[]) =>
    [...new Set(arr.filter(Boolean))].sort() as string[];

  return NextResponse.json({
    brands: unique(watches.map((w) => w.brand)),
    materials: unique(watches.map((w) => w.caseMaterial)),
    conditions: unique(watches.map((w) => w.condition)),
    sources: unique(watches.map((w) => w.purchaseSource)),
    platforms: unique(watches.map((w) => w.salePlatform)),
  });
}
