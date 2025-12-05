import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const watch = await prisma.watch.findUnique({
    where: { id },
  });

  if (!watch) {
    return NextResponse.json({ error: "Watch not found" }, { status: 404 });
  }

  return NextResponse.json(watch);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const data = await request.json();

  const watch = await prisma.watch.update({
    where: { id },
    data: {
      brand: data.brand,
      model: data.model,
      reference: data.reference,
      serial: data.serial,
      caliber: data.caliber,
      caseMaterial: data.caseMaterial,
      dialColor: data.dialColor,
      diameter: data.diameter,
      condition: data.condition,
      purchasePrice: data.purchasePrice,
      purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
      purchaseSource: data.purchaseSource,
      additionalCosts: data.additionalCosts,
      salePrice: data.salePrice,
      saleDate: data.saleDate ? new Date(data.saleDate) : null,
      platformFees: data.platformFees,
      salesTax: data.salesTax,
      marketingCosts: data.marketingCosts,
      shippingCosts: data.shippingCosts,
      status: data.status,
      notes: data.notes,
    },
  });

  return NextResponse.json(watch);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.watch.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
