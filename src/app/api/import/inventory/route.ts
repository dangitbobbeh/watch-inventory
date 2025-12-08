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

  for (const row of rows) {
    try {
      const id = row["ID"]?.trim();
      const brand = row["Brand"]?.trim();
      const model = row["Model"]?.trim();

      if (!brand || !model) {
        errors.push(`Row skipped: missing brand or model`);
        continue;
      }

      await prisma.watch.create({
        data: {
          userId: session.user.id,
          importId: id || null,
          brand,
          model,
          caseMaterial: row["Material"]?.trim() || null,
          reference: row["Reference Number"]?.trim() || null,
          year: row["Year"]?.trim() || null,
          accessories: row["Accessories"]?.trim() || null,
          notes: row["Comments"]?.trim() || null,
          purchaseDate: parseDate(row["Purchase Date"]),
          purchaseSource: row["Purchase Location"]?.trim() || null,
          purchasePrice: parseNumber(row["Purchase Price"]),
          purchaseShippingCost: parseNumber(row["Shipping Cost"]),
          additionalCosts: parseNumber(row["Additional Costs (service, etc.)"]),
          status: "in_stock",
        },
      });

      success++;
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      errors.push(`Row ${row["ID"] || "?"}: ${msg}`);
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
