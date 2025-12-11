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

  // Build where clause
  const where: { userId: string; status?: string } = {
    userId: session.user.id,
  };

  if (status && status !== "all") {
    where.status = status;
  }

  const watches = await prisma.watch.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  // CSV headers
  const headers = [
    "ID",
    "Brand",
    "Model",
    "Reference",
    "Serial",
    "Year",
    "Caliber",
    "Case Material",
    "Dial Color",
    "Diameter",
    "Condition",
    "Accessories",
    "Status",
    "Purchase Date",
    "Purchase Source",
    "Purchase Price",
    "Purchase Shipping",
    "Additional Costs",
    "Total Cost",
    "Sale Date",
    "Sale Price",
    "Sale Platform",
    "Platform Fees",
    "Sales Tax",
    "Shipping Costs",
    "Marketing Costs",
    "Total Fees",
    "Profit",
    "ROI %",
    "Notes",
  ];

  // Build rows
  const rows = watches.map((watch) => {
    const purchasePrice = Number(watch.purchasePrice) || 0;
    const purchaseShipping = Number(watch.purchaseShippingCost) || 0;
    const additionalCosts = Number(watch.additionalCosts) || 0;
    const totalCost = purchasePrice + purchaseShipping + additionalCosts;

    const salePrice = Number(watch.salePrice) || 0;
    const platformFees = Number(watch.platformFees) || 0;
    const salesTax = Number(watch.salesTax) || 0;
    const shippingCosts = Number(watch.shippingCosts) || 0;
    const marketingCosts = Number(watch.marketingCosts) || 0;
    const totalFees = platformFees + shippingCosts + marketingCosts;

    const profit = watch.salePrice ? salePrice - totalFees - totalCost : null;
    const roi =
      profit !== null && totalCost > 0 ? (profit / totalCost) * 100 : null;

    return [
      watch.importId || watch.id,
      watch.brand,
      watch.model,
      watch.reference || "",
      watch.serial || "",
      watch.year || "",
      watch.caliber || "",
      watch.caseMaterial || "",
      watch.dialColor || "",
      watch.diameter ? Number(watch.diameter) : "",
      watch.condition || "",
      watch.accessories || "",
      watch.status,
      watch.purchaseDate ? watch.purchaseDate.toISOString().split("T")[0] : "",
      watch.purchaseSource || "",
      purchasePrice || "",
      purchaseShipping || "",
      additionalCosts || "",
      totalCost || "",
      watch.saleDate ? watch.saleDate.toISOString().split("T")[0] : "",
      salePrice || "",
      watch.salePlatform || "",
      platformFees || "",
      salesTax || "",
      shippingCosts || "",
      marketingCosts || "",
      totalFees || "",
      profit !== null ? profit.toFixed(2) : "",
      roi !== null ? roi.toFixed(1) : "",
      watch.notes || "",
    ];
  });

  // Escape CSV values properly
  const escapeCSV = (value: string | number | null): string => {
    const str = String(value ?? "");
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Build CSV string
  const csv = [
    headers.join(","),
    ...rows.map((row) => row.map(escapeCSV).join(",")),
  ].join("\n");

  // Generate filename with date
  const filename = `watch-inventory-${
    new Date().toISOString().split("T")[0]
  }.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
