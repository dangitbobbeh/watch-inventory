import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { rows } = await request.json();

  let success = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const brand = row.brand?.trim();
      const model = row.model?.trim();

      if (!brand || !model) {
        errors.push(`Row ${i + 1}: missing brand or model`);
        continue;
      }

      await prisma.watch.create({
        data: {
          userId: session.user.id,
          importId: row.importId?.trim() || null,
          brand,
          model,
          reference: row.reference?.trim() || null,
          serial: row.serial?.trim() || null,
          year: row.year?.trim() || null,
          caseMaterial: row.caseMaterial?.trim() || null,
          dialColor: row.dialColor?.trim() || null,
          diameter: parseNumber(row.diameter),
          condition: row.condition?.trim() || null,
          accessories: row.accessories?.trim() || null,
          notes: row.notes?.trim() || null,
          purchaseDate: parseDate(row.purchaseDate),
          purchaseSource: row.purchaseSource?.trim() || null,
          purchasePrice: parseNumber(row.purchasePrice),
          purchaseShippingCost: parseNumber(row.purchaseShippingCost),
          additionalCosts: parseNumber(row.additionalCosts),
          status: "in_stock",
        },
      });

      success++;
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      errors.push(`Row ${i + 1}: ${msg}`);
    }
  }

  return NextResponse.json({ success, errors });
}

function parseDate(value: string | undefined): Date | null {
  if (!value?.trim()) return null;
  const date = new Date(value.trim());
  return isNaN(date.getTime()) ? null : date;
}

function parseNumber(value: string | undefined): number | null {
  if (!value?.trim()) return null;
  const cleaned = value.replace(/[^0-9.-]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}
