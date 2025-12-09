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
      const importId = row.importId?.trim();

      if (!importId) {
        errors.push(`Row ${i + 1}: missing Watch ID`);
        continue;
      }

      const watch = await prisma.watch.findFirst({
        where: {
          importId,
          userId: session.user.id,
        },
      });

      if (!watch) {
        errors.push(
          `Row ${i + 1}: Watch ID "${importId}" not found in inventory`
        );
        continue;
      }

      await prisma.watch.update({
        where: { id: watch.id },
        data: {
          saleDate: parseDate(row.saleDate),
          salePrice: parseNumber(row.salePrice),
          salePlatform: row.salePlatform?.trim() || null,
          platformFees: parseNumber(row.platformFees),
          salesTax: parseNumber(row.salesTax),
          marketingCosts: parseNumber(row.marketingCosts),
          shippingCosts: parseNumber(row.shippingCosts),
          status: "sold",
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
