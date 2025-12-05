import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const { rows } = await request.json();

  let success = 0;
  const errors: string[] = [];

  for (const row of rows) {
    try {
      // Find the watch by importId (your Watch ID column)
      const watchId = row["Watch ID"]?.trim();

      if (!watchId) {
        errors.push(`Row skipped: missing Watch ID`);
        continue;
      }

      const watch = await prisma.watch.findUnique({
        where: { importId: watchId },
      });

      if (!watch) {
        errors.push(`Watch ID ${watchId}: not found in inventory`);
        continue;
      }

      // Update with sale data
      await prisma.watch.update({
        where: { id: watch.id },
        data: {
          salePlatform: row["Sale Platform"]?.trim() || null,
          saleDate: parseDate(row["Sale Date"]),
          salePrice: parseNumber(row["Sold Price"]),
          salesTax: parseNumber(row["Sales Tax"]),
          platformFees: parseNumber(row["Platform Fees"]),
          marketingCosts: parseNumber(row["Marketing Fees"]),
          shippingCosts: parseNumber(row["Shipping Cost"]),
          status: "sold",
        },
      });

      success++;
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      errors.push(`Sale ${row["Sale ID"] || "?"}: ${msg}`);
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
