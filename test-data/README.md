# Test CSV Files

This directory contains test CSV files with various formats and edge cases for testing the AI-powered import system.

## File Descriptions

### unified-complete.csv
**Purpose:** Tests a single CSV containing both inventory AND sales data with status indicators.

**Features tested:**
- Mixed sold/for-sale watches in same file
- Status column with various values (Sold, For Sale, Listed, etc.)
- Asking price column (should become custom data)
- Sold For column (actual sale price)
- All standard fields populated

**Expected behavior:**
- Watches with "Sold" status → `sold`
- Watches with "For Sale", "Listed", "Available" → `in_stock`
- Asking Price → stored in customData
- Sold For → mapped to salePrice

---

### inventory-standard.csv
**Purpose:** Tests common alternative column names that a typical user might have.

**Column name variations:**
- "Watch Brand" instead of "Brand"
- "Watch Model" instead of "Model"
- "Ref #" instead of "Reference"
- "S/N" instead of "Serial"
- "Price Paid" instead of "Purchase Price"
- "Bought From" instead of "Source"
- "Box/Papers" instead of "Accessories"

**Expected behavior:**
- AI should recognize all these synonyms
- All rows should import successfully

---

### inventory-weird-columns.csv
**Purpose:** Tests unusual/legacy column naming conventions.

**Column name variations:**
- `ITEM_CODE` → importId
- `MAKE` → brand
- `NAME` → model
- `REF_NUM` → reference
- `SERIAL_NUM` → serial
- `YR` → year
- `CASE_MTL` → caseMaterial
- `FACE_COLOR` → dialColor
- `COND_RATING` → condition
- `ACQUIRED_ON` → purchaseDate
- `TOTAL_COST` → purchasePrice
- `SHIP_FEE` → purchaseShippingCost
- `OTHER_EXP` → additionalCosts
- `MEMO` → notes

**Expected behavior:**
- AI should infer mappings from context and sample data
- All rows should import with correct field assignments

---

### sales-only.csv
**Purpose:** Tests the "Update Sales" flow for adding sale data to existing inventory.

**Features tested:**
- Matching by Watch ID
- Sale-specific fields only (no watch details)
- Various fee columns

**Expected behavior:**
- Should require Watch ID mapping
- Should match existing records by importId
- Should update status to "sold"

---

### minimal.csv
**Purpose:** Tests the minimum viable import (just Brand and Model).

**Features tested:**
- Only required fields present
- No optional data

**Expected behavior:**
- All rows should import successfully
- Status should default to "in_stock"
- All other fields should be null

---

### various-status.csv
**Purpose:** Tests all possible status value variations.

**Status values included:**
- FOR SALE, AVAILABLE, In Stock, Listed, active → `in_stock`
- SOLD, Completed, sold, Archived, Closed → `sold`
- TRADED, Trade → `traded`
- CONSIGNED, Consignment, memo → `consigned`

**Expected behavior:**
- All status variations normalized correctly
- Case-insensitive matching

---

### edge-cases.csv
**Purpose:** Tests problematic data that might break parsing.

**Edge cases included:**
- Currency formatting: `$12,500.00`, `$5,000`, `3100.50`
- Date formats: `01/15/2024`, `2024-01-20`, `Jan 15 2024`, `15-01-2024`, `2024/01/20`
- Empty/missing values in middle of data
- Missing required fields (row 3 has no brand)
- Extra irrelevant columns (Row #, Random Column, Empty Column)
- Price with comma in wrong place: `$4,200`
- Status that conflicts with data (Status empty but has sale price)

**Expected behavior:**
- Currency formatting stripped correctly
- Multiple date formats parsed
- Missing required fields cause row-level errors (not full failure)
- Irrelevant columns ignored

---

### dealer-spreadsheet.csv
**Purpose:** Tests a realistic export from a dealer's inventory management system.

**Features tested:**
- Many columns (25+)
- Verbose column names ("Watch Manufacturer", "Year of Production")
- Calculated columns (Net Profit, ROI %)
- Internal tracking columns (Internal Code, Last Updated)

**Expected behavior:**
- Core watch data extracted correctly
- Calculated fields stored as custom data or ignored
- Internal tracking fields skipped
- Complex mapping handles gracefully

---

### split-inventory.csv + split-sales.csv
**Purpose:** Tests the two-file workflow (import inventory first, then update with sales).

**Workflow:**
1. Import `split-inventory.csv` as New Inventory
2. Import `split-sales.csv` as Update Sales
3. Sales file matches inventory by ID column

**Expected behavior:**
- First import creates records with importId
- Second import finds matches and adds sale data
- Unmatched IDs in sales file produce errors

---

## Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode during development
npm run test:watch
```

## Adding New Test Cases

When adding new test scenarios:

1. Create a new CSV file in this directory
2. Add corresponding tests in `src/__tests__/csv-import.test.ts`
3. Document the test case in this README
4. Consider edge cases that might break:
   - Column name variations
   - Data format variations
   - Missing/null values
   - Unicode characters
   - Very long values
   - Special characters in values
