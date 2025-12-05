import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const anthropic = new Anthropic();

export async function POST(request: Request) {
  const { messages } = await request.json();

  if (!messages || messages.length === 0) {
    return NextResponse.json({ error: "Messages required" }, { status: 400 });
  }

  // Fetch all data for context
  const watches = await prisma.watch.findMany({
    orderBy: { createdAt: "desc" },
  });

  const inStock = watches.filter((w) => w.status === "in_stock");
  const sold = watches.filter((w) => w.status === "sold");
  const now = new Date();

  // Calculate comprehensive stats
  const soldWithStats = sold.map((w) => {
    const purchasePrice = Number(w.purchasePrice) || 0;
    const purchaseShipping = Number(w.purchaseShippingCost) || 0;
    const additionalCosts = Number(w.additionalCosts) || 0;
    const salePrice = Number(w.salePrice) || 0;
    const platformFees = Number(w.platformFees) || 0;
    const marketingCosts = Number(w.marketingCosts) || 0;
    const shippingCosts = Number(w.shippingCosts) || 0;
    const salesTax = Number(w.salesTax) || 0;

    const totalCost = purchasePrice + purchaseShipping + additionalCosts;
    const totalSaleCosts =
      platformFees + marketingCosts + shippingCosts + salesTax;
    const profit = salePrice - totalSaleCosts - totalCost;

    const daysToSell =
      w.purchaseDate && w.saleDate
        ? Math.round(
            (new Date(w.saleDate).getTime() -
              new Date(w.purchaseDate).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : null;

    return {
      brand: w.brand,
      model: w.model,
      reference: w.reference,
      year: w.year,
      caseMaterial: w.caseMaterial,
      condition: w.condition,
      accessories: w.accessories,
      purchaseSource: w.purchaseSource,
      purchaseDate: w.purchaseDate,
      salePlatform: w.salePlatform,
      saleDate: w.saleDate,
      totalCost,
      salePrice,
      profit,
      profitMargin: totalCost > 0 ? (profit / totalCost) * 100 : 0,
      daysToSell,
    };
  });

  const inStockWithStats = inStock.map((w) => {
    const totalCost =
      (Number(w.purchasePrice) || 0) +
      (Number(w.purchaseShippingCost) || 0) +
      (Number(w.additionalCosts) || 0);
    const daysInStock = w.purchaseDate
      ? Math.round(
          (now.getTime() - new Date(w.purchaseDate).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

    return {
      brand: w.brand,
      model: w.model,
      reference: w.reference,
      year: w.year,
      caseMaterial: w.caseMaterial,
      condition: w.condition,
      accessories: w.accessories,
      purchaseSource: w.purchaseSource,
      purchaseDate: w.purchaseDate,
      totalCost,
      daysInStock,
    };
  });

  // Summary statistics
  const totalProfit = soldWithStats.reduce((sum, w) => sum + w.profit, 0);
  const totalRevenue = soldWithStats.reduce((sum, w) => sum + w.salePrice, 0);
  const avgProfit = sold.length > 0 ? totalProfit / sold.length : 0;
  const avgMargin =
    soldWithStats.length > 0
      ? soldWithStats.reduce((sum, w) => sum + w.profitMargin, 0) /
        soldWithStats.length
      : 0;
  const avgDaysToSell =
    soldWithStats.filter((w) => w.daysToSell).length > 0
      ? soldWithStats.reduce((sum, w) => sum + (w.daysToSell || 0), 0) /
        soldWithStats.filter((w) => w.daysToSell).length
      : 0;
  const inventoryValue = inStockWithStats.reduce(
    (sum, w) => sum + w.totalCost,
    0
  );

  // Profit by brand
  const profitByBrand: Record<
    string,
    { profit: number; count: number; avgDays: number }
  > = {};
  soldWithStats.forEach((w) => {
    if (!profitByBrand[w.brand]) {
      profitByBrand[w.brand] = { profit: 0, count: 0, avgDays: 0 };
    }
    profitByBrand[w.brand].profit += w.profit;
    profitByBrand[w.brand].count += 1;
    profitByBrand[w.brand].avgDays += w.daysToSell || 0;
  });
  Object.keys(profitByBrand).forEach((brand) => {
    profitByBrand[brand].avgDays =
      profitByBrand[brand].avgDays / profitByBrand[brand].count;
  });

  // Profit by platform
  const profitByPlatform: Record<
    string,
    { profit: number; count: number; revenue: number }
  > = {};
  soldWithStats.forEach((w) => {
    const platform = w.salePlatform || "Unknown";
    if (!profitByPlatform[platform]) {
      profitByPlatform[platform] = { profit: 0, count: 0, revenue: 0 };
    }
    profitByPlatform[platform].profit += w.profit;
    profitByPlatform[platform].count += 1;
    profitByPlatform[platform].revenue += w.salePrice;
  });

  // Profit by source
  const profitBySource: Record<
    string,
    { profit: number; count: number; totalCost: number }
  > = {};
  soldWithStats.forEach((w) => {
    const source = w.purchaseSource || "Unknown";
    if (!profitBySource[source]) {
      profitBySource[source] = { profit: 0, count: 0, totalCost: 0 };
    }
    profitBySource[source].profit += w.profit;
    profitBySource[source].count += 1;
    profitBySource[source].totalCost += w.totalCost;
  });

  // Monthly breakdown
  const monthlyStats: Record<
    string,
    { profit: number; count: number; revenue: number }
  > = {};
  soldWithStats.forEach((w) => {
    if (!w.saleDate) return;
    const date = new Date(w.saleDate);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
    if (!monthlyStats[key]) {
      monthlyStats[key] = { profit: 0, count: 0, revenue: 0 };
    }
    monthlyStats[key].profit += w.profit;
    monthlyStats[key].count += 1;
    monthlyStats[key].revenue += w.salePrice;
  });

  const systemPrompt = `You are a knowledgeable assistant for a luxury watch dealer. You have complete access to their business data and can answer any questions about their inventory, sales, profits, and performance.

BUSINESS SUMMARY:
- Total watches sold: ${sold.length}
- Currently in stock: ${inStock.length}
- Total profit: $${totalProfit.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}
- Total revenue: $${totalRevenue.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}
- Average profit per sale: $${avgProfit.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}
- Average profit margin: ${avgMargin.toFixed(1)}%
- Average days to sell: ${Math.round(avgDaysToSell)} days
- Current inventory value: $${inventoryValue.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}

PROFIT BY BRAND:
${JSON.stringify(profitByBrand, null, 2)}

PROFIT BY SALE PLATFORM:
${JSON.stringify(profitByPlatform, null, 2)}

PROFIT BY PURCHASE SOURCE:
${JSON.stringify(profitBySource, null, 2)}

MONTHLY PERFORMANCE:
${JSON.stringify(monthlyStats, null, 2)}

CURRENT INVENTORY (${inStockWithStats.length} watches):
${JSON.stringify(inStockWithStats, null, 2)}

SALES HISTORY (${soldWithStats.length} watches):
${JSON.stringify(soldWithStats, null, 2)}

Answer questions conversationally and precisely. Use specific numbers from the data. If comparing periods, calculate the differences. If asked about trends, analyze the monthly data. Be concise but thorough.`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    const response =
      message.content[0].type === "text" ? message.content[0].text : "";

    return NextResponse.json({ response });
  } catch (error) {
    console.error("AI error:", error);
    return NextResponse.json({ error: "Failed to respond" }, { status: 500 });
  }
}
