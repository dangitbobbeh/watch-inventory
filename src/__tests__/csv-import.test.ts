import * as fs from 'fs';
import * as path from 'path';
import Papa from 'papaparse';
import { 
  transformInventoryRow, 
  normalizeStatus, 
  parseNumber, 
  parseDate,
  validateRequiredFields 
} from '@/lib/import-utils';

// Helper to parse CSV file
function parseCSVFile(filename: string): { headers: string[]; rows: Record<string, string>[] } {
  const filePath = path.join(process.cwd(), 'test-data', filename);
  const content = fs.readFileSync(filePath, 'utf-8');
  const result = Papa.parse(content, { header: true, skipEmptyLines: true });
  return {
    headers: result.meta.fields || [],
    rows: result.data as Record<string, string>[],
  };
}

// Simulate the mapping transformation that happens after AI analysis
function applyMapping(row: Record<string, string>, mapping: Record<string, string | null>): Record<string, string> {
  const transformed: Record<string, string> = {};
  const customData: Record<string, string> = {};
  
  Object.entries(mapping).forEach(([header, fieldKey]) => {
    if (fieldKey && row[header]) {
      if (fieldKey === 'custom') {
        customData[header] = row[header];
      } else {
        transformed[fieldKey] = row[header];
      }
    }
  });
  
  if (Object.keys(customData).length > 0) {
    transformed._customData = JSON.stringify(customData);
  }
  
  return transformed;
}

describe('CSV Import Integration Tests', () => {
  describe('unified-complete.csv', () => {
    let csv: { headers: string[]; rows: Record<string, string>[] };
    
    beforeAll(() => {
      csv = parseCSVFile('unified-complete.csv');
    });

    it('has expected headers', () => {
      expect(csv.headers).toContain('ID');
      expect(csv.headers).toContain('Brand');
      expect(csv.headers).toContain('Model');
      expect(csv.headers).toContain('Status');
      expect(csv.headers).toContain('Asking Price');
      expect(csv.headers).toContain('Sold For');
    });

    it('correctly identifies sold vs in-stock watches', () => {
      // Simulate mapping
      const mapping: Record<string, string | null> = {
        'ID': 'importId',
        'Brand': 'brand',
        'Model': 'model',
        'Status': 'status',
        'Cost': 'purchasePrice',
        'Sold For': 'salePrice',
        'Asking Price': 'askingPrice',
      };

      const soldWatch = csv.rows.find(r => r['ID'] === 'W001');
      const forSaleWatch = csv.rows.find(r => r['ID'] === 'W002');

      if (soldWatch) {
        const transformed = applyMapping(soldWatch, mapping);
        const { data } = transformInventoryRow(transformed);
        expect(data.status).toBe('sold');
      }

      if (forSaleWatch) {
        const transformed = applyMapping(forSaleWatch, mapping);
        const { data } = transformInventoryRow(transformed);
        expect(data.status).toBe('in_stock');
      }
    });

    it('stores asking price as custom data', () => {
      const mapping: Record<string, string | null> = {
        'Brand': 'brand',
        'Model': 'model',
        'Asking Price': 'askingPrice',
      };

      const watch = csv.rows[0];
      const transformed = applyMapping(watch, mapping);
      const { customData } = transformInventoryRow(transformed);
      
      expect(customData['Asking Price']).toBeDefined();
    });
  });

  describe('inventory-standard.csv', () => {
    let csv: { headers: string[]; rows: Record<string, string>[] };
    
    beforeAll(() => {
      csv = parseCSVFile('inventory-standard.csv');
    });

    it('handles common alternative column names', () => {
      // These are typical synonyms that should be recognized
      expect(csv.headers).toContain('Watch Brand');
      expect(csv.headers).toContain('Watch Model');
      expect(csv.headers).toContain('Ref #');
      expect(csv.headers).toContain('S/N');
      expect(csv.headers).toContain('Price Paid');
    });

    it('parses all rows without errors', () => {
      const mapping: Record<string, string | null> = {
        'Watch Brand': 'brand',
        'Watch Model': 'model',
        'Ref #': 'reference',
        'S/N': 'serial',
        'Production Year': 'year',
        'Material': 'caseMaterial',
        'Dial': 'dialColor',
        'Size (mm)': 'diameter',
        'Condition': 'condition',
        'Box/Papers': 'accessories',
        'Date Purchased': 'purchaseDate',
        'Bought From': 'purchaseSource',
        'Price Paid': 'purchasePrice',
        'Inbound Shipping': 'purchaseShippingCost',
        'Repair Costs': 'additionalCosts',
        'Comments': 'notes',
      };

      csv.rows.forEach((row, i) => {
        const transformed = applyMapping(row, mapping);
        const validation = validateRequiredFields(transformed, ['brand', 'model']);
        expect(validation.valid).toBe(true);
        
        const { data } = transformInventoryRow(transformed);
        expect(data.brand).toBeTruthy();
        expect(data.model).toBeTruthy();
      });
    });
  });

  describe('inventory-weird-columns.csv', () => {
    let csv: { headers: string[]; rows: Record<string, string>[] };
    
    beforeAll(() => {
      csv = parseCSVFile('inventory-weird-columns.csv');
    });

    it('handles unusual column naming conventions', () => {
      expect(csv.headers).toContain('ITEM_CODE');
      expect(csv.headers).toContain('MAKE');
      expect(csv.headers).toContain('NAME');
      expect(csv.headers).toContain('TOTAL_COST');
      expect(csv.headers).toContain('MEMO');
    });

    it('maps unusual columns correctly', () => {
      const mapping: Record<string, string | null> = {
        'ITEM_CODE': 'importId',
        'MAKE': 'brand',
        'NAME': 'model',
        'REF_NUM': 'reference',
        'SERIAL_NUM': 'serial',
        'YR': 'year',
        'CASE_MTL': 'caseMaterial',
        'FACE_COLOR': 'dialColor',
        'COND_RATING': 'condition',
        'EXTRAS': 'accessories',
        'ACQUIRED_ON': 'purchaseDate',
        'VENDOR': 'purchaseSource',
        'TOTAL_COST': 'purchasePrice',
        'SHIP_FEE': 'purchaseShippingCost',
        'OTHER_EXP': 'additionalCosts',
        'MEMO': 'notes',
      };

      const row = csv.rows[0];
      const transformed = applyMapping(row, mapping);
      const { data } = transformInventoryRow(transformed);

      expect(data.brand).toBe('Panerai');
      expect(data.model).toBe('Luminor Marina');
      expect(data.importId).toBe('INV-001');
    });
  });

  describe('sales-only.csv', () => {
    let csv: { headers: string[]; rows: Record<string, string>[] };
    
    beforeAll(() => {
      csv = parseCSVFile('sales-only.csv');
    });

    it('has Watch ID for matching', () => {
      expect(csv.headers).toContain('Watch ID');
    });

    it('validates all rows have Watch ID', () => {
      csv.rows.forEach((row, i) => {
        expect(row['Watch ID']).toBeTruthy();
      });
    });

    it('parses sale prices correctly', () => {
      const row = csv.rows[0];
      expect(parseNumber(row['Selling Price'])).toBe(5200);
      expect(parseNumber(row['Selling Fees'])).toBe(520);
    });
  });

  describe('minimal.csv', () => {
    let csv: { headers: string[]; rows: Record<string, string>[] };
    
    beforeAll(() => {
      csv = parseCSVFile('minimal.csv');
    });

    it('works with just brand and model', () => {
      expect(csv.headers).toEqual(['Brand', 'Model']);
      
      csv.rows.forEach(row => {
        const validation = validateRequiredFields(row, ['Brand', 'Model']);
        expect(validation.valid).toBe(true);
      });
    });

    it('defaults to in_stock status when not provided', () => {
      const mapping: Record<string, string | null> = {
        'Brand': 'brand',
        'Model': 'model',
      };

      csv.rows.forEach(row => {
        const transformed = applyMapping(row, mapping);
        const { data } = transformInventoryRow(transformed);
        expect(data.status).toBe('in_stock');
      });
    });
  });

  describe('various-status.csv', () => {
    let csv: { headers: string[]; rows: Record<string, string>[] };
    
    beforeAll(() => {
      csv = parseCSVFile('various-status.csv');
    });

    it('normalizes all status variations correctly', () => {
      const statusTests: Record<string, string> = {
        'FOR SALE': 'in_stock',
        'AVAILABLE': 'in_stock',
        'In Stock': 'in_stock',
        'SOLD': 'sold',
        'Completed': 'sold',
        'sold': 'sold',
        'Listed': 'in_stock',
        'active': 'in_stock',
        'TRADED': 'traded',
        'Trade': 'traded',
        'CONSIGNED': 'consigned',
        'Consignment': 'consigned',
        'memo': 'consigned',
        'Archived': 'sold',
        'Closed': 'sold',
      };

      csv.rows.forEach(row => {
        const originalStatus = row['Status'];
        const normalized = normalizeStatus(originalStatus, row['Sale Price']);
        
        if (statusTests[originalStatus]) {
          expect(normalized).toBe(statusTests[originalStatus]);
        }
      });
    });
  });

  describe('edge-cases.csv', () => {
    let csv: { headers: string[]; rows: Record<string, string>[] };
    
    beforeAll(() => {
      csv = parseCSVFile('edge-cases.csv');
    });

    it('handles currency formatting in prices', () => {
      const row1 = csv.rows[0]; // $12500.00
      const row4 = csv.rows[3]; // 3100.50
      const row5 = csv.rows[4]; // "$5,500.00"

      expect(parseNumber(row1['Cost'])).toBe(12500);
      expect(parseNumber(row4['Cost'])).toBe(3100.50);
      expect(parseNumber(row5['Cost'])).toBe(5500);
    });

    it('handles various date formats', () => {
      // 01/15/2024, 2024-01-20, Jan 15 2024, 15-01-2024, 2024/01/20
      const dates = csv.rows.map(r => parseDate(r['Purchase Date'])).filter(Boolean);
      
      dates.forEach(date => {
        expect(date).toBeInstanceOf(Date);
        expect(date?.getFullYear()).toBeGreaterThanOrEqual(2023);
      });
    });

    it('handles missing/empty fields gracefully', () => {
      // Row 3 has empty Brand
      const row3 = csv.rows[2];
      
      const mapping: Record<string, string | null> = {
        'Brand': 'brand',
        'Model': 'model',
      };
      
      const transformed = applyMapping(row3, mapping);
      const validation = validateRequiredFields(transformed, ['brand', 'model']);
      
      // Should fail validation due to missing brand
      expect(validation.valid).toBe(false);
      expect(validation.missing).toContain('brand');
    });

    it('ignores irrelevant columns', () => {
      expect(csv.headers).toContain('Random Column');
      expect(csv.headers).toContain('Another Unused');
      expect(csv.headers).toContain('Empty Column');
      
      // These should be mapped to null or custom, not break the import
      const mapping: Record<string, string | null> = {
        'Brand': 'brand',
        'Model': 'model',
        'Random Column': null,
        'Another Unused': null,
        'Empty Column': null,
      };

      const row = csv.rows[0];
      const transformed = applyMapping(row, mapping);
      
      expect(transformed).not.toHaveProperty('Random Column');
    });
  });

  describe('dealer-spreadsheet.csv', () => {
    let csv: { headers: string[]; rows: Record<string, string>[] };
    
    beforeAll(() => {
      csv = parseCSVFile('dealer-spreadsheet.csv');
    });

    it('handles complex dealer spreadsheet format', () => {
      // This CSV has many columns including calculated fields
      expect(csv.headers.length).toBeGreaterThan(20);
      expect(csv.headers).toContain('Watch Manufacturer');
      expect(csv.headers).toContain('Watch Model Name');
      expect(csv.headers).toContain('Purchase Amount');
      expect(csv.headers).toContain('Final Sale Price');
      expect(csv.headers).toContain('Net Profit');
      expect(csv.headers).toContain('ROI %');
    });

    it('correctly maps verbose column names', () => {
      const mapping: Record<string, string | null> = {
        'Inventory #': 'importId',
        'Watch Manufacturer': 'brand',
        'Watch Model Name': 'model',
        'Ref. Number': 'reference',
        'Serial Number': 'serial',
        'Year of Production': 'year',
        'Case Metal': 'caseMaterial',
        'Dial': 'dialColor',
        'Case Diameter': 'diameter',
        'Watch Condition': 'condition',
        "What's Included": 'accessories',
        'Current Status': 'status',
        'Date Acquired': 'purchaseDate',
        'Where Purchased': 'purchaseSource',
        'Purchase Amount': 'purchasePrice',
        'Purchase Shipping': 'purchaseShippingCost',
        'Service/Repair': 'additionalCosts',
        'Target Price': 'askingPrice',
        'Date of Sale': 'saleDate',
        'Final Sale Price': 'salePrice',
        'Where Sold': 'salePlatform',
        'Platform Commission': 'platformFees',
        'Taxes': 'salesTax',
        'Outbound Shipping': 'shippingCosts',
        'Marketing Spend': 'marketingCosts',
        'Notes': 'notes',
        // These should be ignored or stored as custom
        'Lot': 'custom',
        'Net Profit': 'custom',
        'ROI %': 'custom',
        'Internal Code': null,
        'Last Updated': null,
        'List Date': 'custom',
        'Days Listed': 'custom',
      };

      const soldWatch = csv.rows.find(r => r['Current Status'] === 'Sold');
      if (soldWatch) {
        const transformed = applyMapping(soldWatch, mapping);
        const { data, customData } = transformInventoryRow(transformed);
        
        expect(data.brand).toBe('Rolex');
        expect(data.status).toBe('sold');
        expect(data.salePrice).toBe(16500);
        expect(customData['Net Profit']).toBeDefined();
      }
    });
  });

  describe('split-inventory.csv + split-sales.csv', () => {
    let inventoryCsv: { headers: string[]; rows: Record<string, string>[] };
    let salesCsv: { headers: string[]; rows: Record<string, string>[] };
    
    beforeAll(() => {
      inventoryCsv = parseCSVFile('split-inventory.csv');
      salesCsv = parseCSVFile('split-sales.csv');
    });

    it('inventory CSV has matching IDs with sales CSV', () => {
      const inventoryIds = inventoryCsv.rows.map(r => r['ID']);
      const salesIds = salesCsv.rows.map(r => r['ID']);
      
      // All sales IDs should exist in inventory
      salesIds.forEach(id => {
        expect(inventoryIds).toContain(id);
      });
    });

    it('sales CSV updates can be applied to inventory records', () => {
      const inventoryMapping: Record<string, string | null> = {
        'ID': 'importId',
        'Brand': 'brand',
        'Model': 'model',
        'Cost': 'purchasePrice',
      };

      const salesMapping: Record<string, string | null> = {
        'ID': 'importId',
        'Sale Date': 'saleDate',
        'Sale Price': 'salePrice',
        'Platform': 'salePlatform',
        'Fees': 'platformFees',
        'Tax': 'salesTax',
        'Shipping': 'shippingCosts',
        'Marketing': 'marketingCosts',
      };

      // Simulate creating inventory
      const inventoryRecords = inventoryCsv.rows.map(row => {
        const transformed = applyMapping(row, inventoryMapping);
        return transformInventoryRow(transformed).data;
      });

      // Simulate applying sales
      const salesRecords = salesCsv.rows.map(row => {
        const transformed = applyMapping(row, salesMapping);
        return {
          importId: transformed.importId,
          salePrice: parseNumber(transformed.salePrice),
          saleDate: parseDate(transformed.saleDate),
        };
      });

      // Verify we can match and update
      salesRecords.forEach(sale => {
        const matchingInventory = inventoryRecords.find(
          inv => inv.importId === sale.importId
        );
        expect(matchingInventory).toBeDefined();
        expect(sale.salePrice).toBeGreaterThan(0);
      });
    });
  });
});
