import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const anthropic = new Anthropic();

const INVENTORY_FIELDS = [
  {
    key: "importId",
    label: "ID",
    description: "Unique identifier for matching sales data",
  },
  {
    key: "brand",
    label: "Brand",
    description: "Watch brand (e.g., Rolex, Omega)",
    required: true,
  },
  {
    key: "model",
    label: "Model",
    description: "Watch model name",
    required: true,
  },
  {
    key: "reference",
    label: "Reference",
    description: "Reference/model number",
  },
  { key: "serial", label: "Serial", description: "Serial number" },
  { key: "year", label: "Year", description: "Production year" },
  {
    key: "caseMaterial",
    label: "Case Material",
    description: "Material (steel, gold, etc.)",
  },
  { key: "dialColor", label: "Dial Color", description: "Color of the dial" },
  { key: "diameter", label: "Diameter", description: "Case diameter in mm" },
  { key: "condition", label: "Condition", description: "Watch condition" },
  {
    key: "accessories",
    label: "Accessories",
    description: "Included items (box, papers, etc.)",
  },
  { key: "purchaseDate", label: "Purchase Date", description: "Date acquired" },
  {
    key: "purchaseSource",
    label: "Purchase Source",
    description: "Where purchased from",
  },
  {
    key: "purchasePrice",
    label: "Purchase Price",
    description: "Amount paid for watch",
  },
  {
    key: "purchaseShippingCost",
    label: "Purchase Shipping",
    description: "Inbound shipping cost",
  },
  {
    key: "additionalCosts",
    label: "Additional Costs",
    description: "Service, repairs, etc.",
  },
  { key: "notes", label: "Notes", description: "Any additional notes" },
];

const SALES_FIELDS = [
  {
    key: "importId",
    label: "Watch ID",
    description: "ID matching the inventory record",
    required: true,
  },
  { key: "saleDate", label: "Sale Date", description: "Date of sale" },
  { key: "salePrice", label: "Sale Price", description: "Total sale amount" },
  {
    key: "salePlatform",
    label: "Sale Platform",
    description: "Where it was sold",
  },
  {
    key: "platformFees",
    label: "Platform Fees",
    description: "eBay, PayPal fees, etc.",
  },
  { key: "salesTax", label: "Sales Tax", description: "Tax collected" },
  {
    key: "marketingCosts",
    label: "Marketing Costs",
    description: "Advertising costs",
  },
  {
    key: "shippingCosts",
    label: "Shipping Costs",
    description: "Outbound shipping cost",
  },
];

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { headers, sampleRows, type } = await request.json();

  if (!headers || !Array.isArray(headers)) {
    return NextResponse.json({ error: "Headers required" }, { status: 400 });
  }

  const fields = type === "sales" ? SALES_FIELDS : INVENTORY_FIELDS;

  const systemPrompt = `You are a data mapping assistant. Your job is to analyze CSV column headers and map them to a predefined schema.

Here are the target fields you need to map to:
${fields
  .map((f) => `- ${f.key}: ${f.description}${f.required ? " (REQUIRED)" : ""}`)
  .join("\n")}

Rules:
1. Return a JSON object mapping each CSV header to the most appropriate field key, or null if no match
2. Be flexible with naming - "Watch Brand" should map to "brand", "Price Paid" should map to "purchasePrice", etc.
3. Consider common variations: "Cost" likely means "purchasePrice", "Sold For" likely means "salePrice"
4. If a column clearly contains IDs or reference numbers used for matching records, map it to "importId"
5. Only return valid field keys from the list above, or null
6. Return ONLY the JSON object, no explanation`;

  const userPrompt = `CSV Headers: ${JSON.stringify(headers)}

Sample data from first few rows:
${JSON.stringify(sampleRows, null, 2)}

Return a JSON object mapping each header to the appropriate field key (or null if no match).
Example format: {"Column Name": "fieldKey", "Another Column": null}`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Parse the JSON response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response");
    }

    const mapping = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      mapping,
      fields: fields.map((f) => ({
        key: f.key,
        label: f.label,
        required: f.required || false,
      })),
    });
  } catch (error) {
    console.error("AI mapping error:", error);
    return NextResponse.json(
      { error: "Failed to analyze CSV" },
      { status: 500 }
    );
  }
}
