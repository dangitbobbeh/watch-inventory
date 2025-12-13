import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const where: { userId: string; status?: string } = {
    userId: session.user.id,
  };

  if (status) {
    where.status = status;
  }

  const watches = await prisma.watch.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(watches);
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await request.json();

  const watch = await prisma.watch.create({
    data: {
      userId: session.user.id,
      brand: data.brand,
      model: data.model,
      reference: data.reference,
      serial: data.serial,
      year: data.year,
      caliber: data.caliber,
      caseMaterial: data.caseMaterial,
      dialColor: data.dialColor,
      diameter: data.diameter,
      condition: data.condition,
      accessories: data.accessories,
      purchasePrice: data.purchasePrice,
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
      purchaseSource: data.purchaseSource,
      purchaseShippingCost: data.purchaseShippingCost,
      additionalCosts: data.additionalCosts,
      notes: data.notes,
    },
  });

  return NextResponse.json(watch);
}
