import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const anthropic = new Anthropic();

export async function POST(request: Request) {
  const { description } = await request.json();

  if (!description) {
    return NextResponse.json(
      { error: "Description required" },
      { status: 400 }
    );
  }

  // Fetch historical sales data for context
  const soldWatches = await prisma.watch.findMany({
    where: { status: "sold" },
    orderBy: { saleDate: "desc" },
  });

  // Prepare historical data summary
  const salesData = soldWatches.map((w) => {
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
      salePlatform: w.salePlatform,
      totalCost,
      salePrice,
      profit,
      profitMargin:
        totalCost > 0 ? ((profit / totalCost) * 100).toFixed(1) + "%" : "N/A",
      daysToSell,
    };
  });

  const systemPrompt = `You are an expert luxury watch dealer assistant helping analyze potential watch purchases. You have access to the user's complete sales history to inform your recommendations.

Here is the user's historical sales data (${salesData.length} watches sold):

${JSON.stringify(salesData, null, 2)}

Based on this data, you can identify patterns like:
- Which brands/models sell best
- Typical profit margins by brand, material, or condition
- Average days to sell by category
- Which purchase sources yield best deals
- Which sale platforms work best for different watches

When the user describes a watch they're considering, provide:
1. **Estimated Sale Price**: Based on similar pieces in their history
2. **Estimated Profit**: Accounting for typical fees and costs
3. **Time to Sell**: How long it might take based on similar pieces
4. **Risk Assessment**: Low/Medium/High with explanation
5. **Recommendation**: Buy/Pass/Negotiate with reasoning

Be specific and reference their actual historical data when possible. If you don't have enough comparable data, say so and provide general market guidance instead.`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `I'm considering purchasing this watch:\n\n${description}\n\nPlease analyze this potential purchase based on my sales history.`,
        },
      ],
    });

    const response =
      message.content[0].type === "text" ? message.content[0].text : "";

    return NextResponse.json({ analysis: response });
  } catch (error) {
    console.error("AI error:", error);
    return NextResponse.json({ error: "Failed to analyze" }, { status: 500 });
  }
}
