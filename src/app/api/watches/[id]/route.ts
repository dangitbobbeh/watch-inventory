import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const watch = await prisma.watch.findUnique({
    where: { id },
  });

  if (!watch || watch.userId !== session.user.id) {
    return NextResponse.json({ error: "Watch not found" }, { status: 404 });
  }

  return NextResponse.json(watch);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const data = await request.json();

  const existing = await prisma.watch.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Watch not found" }, { status: 404 });
  }

  // Auto-set status to "sold" if sale price is being added to a watch that didn't have one
  let status = data.status;
  const hadNoSalePrice = !existing.salePrice;
  const nowHasSalePrice = data.salePrice && parseFloat(data.salePrice) > 0;

  if (hadNoSalePrice && nowHasSalePrice && status !== "sold") {
    status = "sold";
  }

  const watch = await prisma.watch.update({
    where: { id },
    data: {
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
      salePrice: data.salePrice,
      saleDate: data.saleDate ? new Date(data.saleDate) : null,
      salePlatform: data.salePlatform,
      platformFees: data.platformFees,
      salesTax: data.salesTax,
      marketingCosts: data.marketingCosts,
      shippingCosts: data.shippingCosts,
      status,
      notes: data.notes,
    },
  });

  return NextResponse.json(watch);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.watch.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Watch not found" }, { status: 404 });
  }

  await prisma.watch.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
