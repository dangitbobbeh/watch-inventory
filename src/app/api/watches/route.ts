import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const data = await request.json();

  const watch = await prisma.watch.create({
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
      notes: data.notes,
    },
  });

  return NextResponse.json(watch);
}
