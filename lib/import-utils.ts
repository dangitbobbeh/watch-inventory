/**
 * Utility functions for CSV import processing
 */

/**
 * Normalize status values to standard enum values
 */
export function normalizeStatus(statusValue: string | undefined, salePrice: string | undefined): string {
  const status = statusValue?.toLowerCase().trim();
  
  // If there's a sale price and no explicit status, mark as sold
  if (!status && salePrice && parseNumber(salePrice)) {
    return 'sold';
  }
  
  if (!status) {
    return 'in_stock';
  }
  
  // Map common status values
  if (['sold', 'completed', 'closed', 'archived'].includes(status)) {
    return 'sold';
  }
  if (['traded', 'trade', 'swapped'].includes(status)) {
    return 'traded';
  }
  if (['consigned', 'consignment', 'memo'].includes(status)) {
    return 'consigned';
  }
  if (['for sale', 'available', 'in stock', 'in_stock', 'listed', 'active', 'inventory', 'unsold'].includes(status)) {
    return 'in_stock';
  }
  
  // Default to in_stock for unrecognized values
  return 'in_stock';
}

/**
 * Parse a date string in various formats to a Date object
 */
export function parseDate(value: string | undefined): Date | null {
  if (!value?.trim()) return null;
  
  const trimmed = value.trim();
  
  // Try standard ISO format first
  let date = new Date(trimmed);
  if (!isNaN(date.getTime())) {
    return date;
  }
  
  // Try MM/DD/YYYY format
  const mmddyyyy = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mmddyyyy) {
    date = new Date(parseInt(mmddyyyy[3]), parseInt(mmddyyyy[1]) - 1, parseInt(mmddyyyy[2]));
    if (!isNaN(date.getTime())) return date;
  }
  
  // Try DD-MM-YYYY format
  const ddmmyyyy = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (ddmmyyyy) {
    date = new Date(parseInt(ddmmyyyy[3]), parseInt(ddmmyyyy[2]) - 1, parseInt(ddmmyyyy[1]));
    if (!isNaN(date.getTime())) return date;
  }
  
  // Try YYYY/MM/DD format
  const yyyymmdd = trimmed.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (yyyymmdd) {
    date = new Date(parseInt(yyyymmdd[1]), parseInt(yyyymmdd[2]) - 1, parseInt(yyyymmdd[3]));
    if (!isNaN(date.getTime())) return date;
  }
  
  return null;
}

/**
 * Parse a number from various string formats
 * Handles currency symbols, commas, and other formatting
 */
export function parseNumber(value: string | undefined): number | null {
  if (!value?.trim()) return null;
  
  // Remove currency symbols, commas, spaces
  const cleaned = value.replace(/[^0-9.-]/g, '');
  
  if (!cleaned) return null;
  
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

/**
 * Clean and trim a string value, returning null for empty strings
 */
export function cleanString(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed || null;
}

/**
 * Validate that required fields are present in a row
 */
export function validateRequiredFields(
  row: Record<string, string>,
  requiredFields: string[]
): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  
  for (const field of requiredFields) {
    if (!row[field]?.trim()) {
      missing.push(field);
    }
  }
  
  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Transform a raw CSV row into a structured watch data object
 */
export function transformInventoryRow(row: Record<string, string>): {
  data: Record<string, unknown>;
  customData: Record<string, string>;
} {
  const data: Record<string, unknown> = {};
  const customData: Record<string, string> = {};
  
  // Handle custom data if present
  if (row._customData) {
    try {
      Object.assign(customData, JSON.parse(row._customData));
    } catch {
      // Ignore parse errors
    }
  }
  
  // Handle asking price as custom data
  if (row.askingPrice) {
    customData['Asking Price'] = row.askingPrice;
  }
  
  // Map standard fields
  data.brand = cleanString(row.brand);
  data.model = cleanString(row.model);
  data.reference = cleanString(row.reference);
  data.serial = cleanString(row.serial);
  data.year = cleanString(row.year);
  data.caseMaterial = cleanString(row.caseMaterial);
  data.dialColor = cleanString(row.dialColor);
  data.diameter = parseNumber(row.diameter);
  data.condition = cleanString(row.condition);
  data.accessories = cleanString(row.accessories);
  data.notes = cleanString(row.notes);
  data.importId = cleanString(row.importId);
  
  // Purchase fields
  data.purchaseDate = parseDate(row.purchaseDate);
  data.purchaseSource = cleanString(row.purchaseSource);
  data.purchasePrice = parseNumber(row.purchasePrice);
  data.purchaseShippingCost = parseNumber(row.purchaseShippingCost);
  data.additionalCosts = parseNumber(row.additionalCosts);
  
  // Sale fields
  data.saleDate = parseDate(row.saleDate);
  data.salePrice = parseNumber(row.salePrice);
  data.salePlatform = cleanString(row.salePlatform);
  data.platformFees = parseNumber(row.platformFees);
  data.salesTax = parseNumber(row.salesTax);
  data.marketingCosts = parseNumber(row.marketingCosts);
  data.shippingCosts = parseNumber(row.shippingCosts);
  
  // Status
  data.status = normalizeStatus(row.status, row.salePrice);
  
  return { data, customData };
}
