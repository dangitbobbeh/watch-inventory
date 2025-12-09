import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const anthropic = new Anthropic();

const ALL_FIELDS = [
  { key: 'importId', label: 'Watch ID', description: 'Unique identifier for the record' },
  { key: 'brand', label: 'Brand', description: 'Watch brand (e.g., Rolex, Omega)' },
  { key: 'model', label: 'Model', description: 'Watch model name' },
  { key: 'reference', label: 'Reference', description: 'Reference/model number' },
  { key: 'serial', label: 'Serial', description: 'Serial number' },
  { key: 'year', label: 'Year', description: 'Production year' },
  { key: 'caseMaterial', label: 'Case Material', description: 'Material (steel, gold, etc.)' },
  { key: 'dialColor', label: 'Dial Color', description: 'Color of the dial' },
  { key: 'diameter', label: 'Diameter', description: 'Case diameter in mm' },
  { key: 'condition', label: 'Condition', description: 'Watch condition' },
  { key: 'accessories', label: 'Accessories', description: 'Included items (box, papers, etc.)' },
  { key: 'status', label: 'Status', description: 'Current status (in_stock, sold, traded, consigned)' },
  { key: 'purchaseDate', label: 'Purchase Date', description: 'Date acquired' },
  { key: 'purchaseSource', label: 'Purchase Source', description: 'Where purchased from' },
  { key: 'purchasePrice', label: 'Purchase Price', description: 'Amount paid for watch (cost basis)' },
  { key: 'purchaseShippingCost', label: 'Purchase Shipping', description: 'Inbound shipping cost' },
  { key: 'additionalCosts', label: 'Additional Costs', description: 'Service, repairs, etc.' },
  { key: 'askingPrice', label: 'Asking Price', description: 'Target/list price (stored as custom data)' },
  { key: 'saleDate', label: 'Sale Date', description: 'Date sold' },
  { key: 'salePrice', label: 'Sale Price', description: 'Actual amount sold for' },
  { key: 'salePlatform', label: 'Sale Platform', description: 'Where it was sold' },
  { key: 'platformFees', label: 'Platform Fees', description: 'eBay, PayPal fees, etc.' },
  { key: 'salesTax', label: 'Sales Tax', description: 'Tax collected' },
  { key: 'marketingCosts', label: 'Marketing Costs', description: 'Advertising costs' },
  { key: 'shippingCosts', label: 'Shipping Costs', description: 'Outbound shipping cost' },
  { key: 'notes', label: 'Notes', description: 'Any additional notes' },
  { key: 'custom', label: 'Custom Field', description: 'Store as custom data' },
];

export async function POST(request: Request) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { headers, sampleRows, mode = 'new' } = await request.json();

  if (!headers || !Array.isArray(headers)) {
    return NextResponse.json({ error: 'Headers required' }, { status: 400 });
  }

  const isUpdateMode = mode === 'update';

  const systemPrompt = `You are a data mapping assistant for a watch inventory system. Your job is to analyze CSV column headers and map them to a predefined schema.

${isUpdateMode ? `
MODE: SALES UPDATE
This CSV is meant to update existing watch records with sale information.
The most important column to identify is the Watch ID / Import ID that will be used to match records.

Key fields to look for:
- importId: Any ID-like column (watch ID, inventory ID, SKU, item #, lot, ID) - THIS IS CRITICAL
- saleDate: Date sold, sell date, sale date
- salePrice: Sold for, selling price, sale amount, final price
- salePlatform: Platform, sold on, marketplace
- platformFees: Fees, selling fees, commission
- salesTax: Tax, taxes
- shippingCosts: Shipping out, outbound shipping
` : `
MODE: NEW INVENTORY
This CSV contains new watch records to import.

Key fields:
- brand (REQUIRED): Watch brand
- model (REQUIRED): Watch model name
- All other fields are optional but useful
`}

Here are all the target fields you can map to:
${ALL_FIELDS.filter(f => f.key !== 'custom').map(f => `- ${f.key}: ${f.description}`).join('\n')}

IMPORTANT SYNONYMS AND MAPPINGS:

For PRICES - be careful to distinguish:
- "cost", "price paid", "purchase amount", "buy price", "acquisition cost", "total cost" → purchasePrice
- "sold for", "selling price", "sale amount", "final price", "sold price", "final sale price" → salePrice  
- "asking price", "list price", "target price", "retail price", "listed at" → askingPrice

For STATUS values - these should map to the "status" field:
- Common values: "for sale", "available", "in stock", "listed" → will become "in_stock"
- "sold", "completed", "closed" → will become "sold"

For IDs - map to importId:
- Any column with: ID, id, #, number, SKU, lot, inventory id, watch id, item number, item code, inventory #

For OTHER COMMON COLUMNS:
- "ref", "ref #", "ref.", "model number", "reference number", "ref. number" → reference
- "s/n", "serial #", "serial number", "serial_num" → serial
- "material", "case", "metal", "case metal", "case material", "case_mtl" → caseMaterial
- "dial", "color", "dial color", "face color" → dialColor
- "size", "case size", "diameter", "case diameter" → diameter
- "source", "dealer", "seller", "bought from", "vendor", "where purchased" → purchaseSource
- "platform", "sold on", "sold via", "marketplace", "where sold" → salePlatform
- "fees", "selling fees", "commission", "platform commission" → platformFees
- "tax", "taxes", "sales tax", "tax collected" → salesTax
- "shipping in", "inbound shipping", "purchase shipping", "ship fee" → purchaseShippingCost
- "shipping out", "outbound shipping", "shipping to buyer" → shippingCosts
- "service cost", "repair", "polish", "maintenance", "service/repair", "other exp" → additionalCosts
- "comments", "memo", "description", "notes" → notes
- "make", "manufacturer", "watch manufacturer", "watch brand" → brand
- "name", "model name", "watch model", "watch model name" → model
- "yr", "year", "production year", "year of production" → year
- "cond", "condition", "watch condition", "cond rating" → condition
- "extras", "included", "accessories", "box/papers", "what's included" → accessories
- "acquired", "date acquired", "date purchased", "date bought", "purchase date", "buy date" → purchaseDate
- "date sold", "sell date", "sale date", "date of sale" → saleDate

Rules:
1. Return a JSON object mapping each CSV header to the most appropriate field key
2. If a column contains useful data but doesn't fit any field, map it to "custom"
3. Only skip columns (map to null) if they're truly irrelevant (like row numbers, timestamps of export, internal codes, empty columns)
4. Be generous with mapping to "custom" for potentially useful business data
5. Return ONLY the JSON object, no explanation`;

  const userPrompt = `CSV Headers: ${JSON.stringify(headers)}

Sample data from first few rows:
${JSON.stringify(sampleRows, null, 2)}

Return a JSON object mapping each header to the appropriate field key.`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }

    const mapping = JSON.parse(jsonMatch[0]);

    // Set required fields based on mode
    const fieldsWithRequired = ALL_FIELDS.map(f => ({
      key: f.key,
      label: f.label,
      required: isUpdateMode 
        ? f.key === 'importId'
        : f.key === 'brand' || f.key === 'model',
    }));

    return NextResponse.json({ 
      mapping,
      fields: fieldsWithRequired,
    });
  } catch (error) {
    console.error('AI mapping error:', error);
    return NextResponse.json({ error: 'Failed to analyze CSV' }, { status: 500 });
  }
}
