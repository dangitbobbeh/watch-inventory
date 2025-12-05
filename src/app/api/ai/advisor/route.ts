import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const anthropic = new Anthropic();

export async function POST() {
  // Fetch all data
  const watches = await prisma.watch.findMany({
    orderBy: { createdAt: "desc" },
  });

  const inStock = watches.filter((w) => w.status === "in_stock");
  const sold = watches.filter((w) => w.status === "sold");

  const now = new Date();

  // Prepare in-stock data with aging
  const inStockData = inStock.map((w) => {
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
      totalCost,
      daysInStock,
    };
  });

  // Prepare sold data for pattern analysis
  const soldData = sold.map((w) => {
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
      caseMaterial: w.caseMaterial,
      condition: w.condition,
      salePlatform: w.salePlatform,
      totalCost,
      salePrice,
      profit,
      profitMargin:
        totalCost > 0 ? ((profit / totalCost) * 100).toFixed(1) + "%" : "N/A",
      daysToSell,
    };
  });

  // Calculate summary stats
  const avgDaysToSell =
    soldData.filter((w) => w.daysToSell).length > 0
      ? soldData.reduce((sum, w) => sum + (w.daysToSell || 0), 0) /
        soldData.filter((w) => w.daysToSell).length
      : 60;

  const totalInventoryValue = inStockData.reduce(
    (sum, w) => sum + w.totalCost,
    0
  );

  const systemPrompt = `You are an expert luxury watch dealer advisor. You analyze inventory and sales patterns to provide actionable recommendations.

Current Inventory (${
    inStockData.length
  } watches, $${totalInventoryValue.toLocaleString()} total value):
${JSON.stringify(inStockData, null, 2)}

Historical Sales Data (${soldData.length} watches sold):
${JSON.stringify(soldData, null, 2)}

Average days to sell historically: ${Math.round(avgDaysToSell)} days

Analyze the current inventory and provide:

1. **Slow Movers**: Identify watches that have been in stock significantly longer than average. For each, suggest why it might be slow and potential actions (price reduction, different platform, etc.)

2. **High Performers Pattern**: Based on sales history, identify what types of watches (brands, materials, price points) sell fastest and most profitably. Note if any current inventory matches these patterns.

3. **Risk Assessment**: Flag any watches that might be at risk of losses based on market position, holding time, or category performance.

4. **Action Items**: Provide 3-5 specific, prioritized recommendations the dealer should take this week.

5. **Opportunities**: Based on what's selling well, suggest what types of watches to look for in future acquisitions.

Be specific, reference actual watches by name, and quantify recommendations where possible (e.g., "consider reducing price by 10-15%").`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content:
            "Please analyze my current inventory and provide your recommendations.",
        },
      ],
    });

    const response =
      message.content[0].type === "text" ? message.content[0].text : "";

    return NextResponse.json({
      analysis: response,
      summary: {
        inStockCount: inStock.length,
        inventoryValue: totalInventoryValue,
        avgDaysToSell: Math.round(avgDaysToSell),
        soldCount: sold.length,
      },
    });
  } catch (error) {
    console.error("AI error:", error);
    return NextResponse.json({ error: "Failed to analyze" }, { status: 500 });
  }
}
