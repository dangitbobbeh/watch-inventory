import {
  normalizeStatus,
  parseDate,
  parseNumber,
  cleanString,
  validateRequiredFields,
  transformInventoryRow,
} from "@/lib/import-utils";

describe("normalizeStatus", () => {
  describe("sold statuses", () => {
    it.each([
      ["sold", "sold"],
      ["SOLD", "sold"],
      ["Sold", "sold"],
      ["completed", "sold"],
      ["COMPLETED", "sold"],
      ["Completed", "sold"],
      ["closed", "sold"],
      ["Closed", "sold"],
      ["archived", "sold"],
      ["Archived", "sold"],
    ])('normalizes "%s" to "%s"', (input, expected) => {
      expect(normalizeStatus(input, undefined)).toBe(expected);
    });
  });

  describe("in_stock statuses", () => {
    it.each([
      ["for sale", "in_stock"],
      ["FOR SALE", "in_stock"],
      ["For Sale", "in_stock"],
      ["available", "in_stock"],
      ["Available", "in_stock"],
      ["in stock", "in_stock"],
      ["In Stock", "in_stock"],
      ["in_stock", "in_stock"],
      ["listed", "in_stock"],
      ["Listed", "in_stock"],
      ["active", "in_stock"],
      ["Active", "in_stock"],
      ["inventory", "in_stock"],
      ["unsold", "in_stock"],
    ])('normalizes "%s" to "%s"', (input, expected) => {
      expect(normalizeStatus(input, undefined)).toBe(expected);
    });
  });

  describe("traded statuses", () => {
    it.each([
      ["traded", "traded"],
      ["TRADED", "traded"],
      ["Traded", "traded"],
      ["trade", "traded"],
      ["Trade", "traded"],
      ["swapped", "traded"],
    ])('normalizes "%s" to "%s"', (input, expected) => {
      expect(normalizeStatus(input, undefined)).toBe(expected);
    });
  });

  describe("consigned statuses", () => {
    it.each([
      ["consigned", "consigned"],
      ["CONSIGNED", "consigned"],
      ["Consigned", "consigned"],
      ["consignment", "consigned"],
      ["Consignment", "consigned"],
      ["memo", "consigned"],
      ["Memo", "consigned"],
    ])('normalizes "%s" to "%s"', (input, expected) => {
      expect(normalizeStatus(input, undefined)).toBe(expected);
    });
  });

  describe("edge cases", () => {
    it("returns in_stock for undefined status", () => {
      expect(normalizeStatus(undefined, undefined)).toBe("in_stock");
    });

    it("returns in_stock for empty string status", () => {
      expect(normalizeStatus("", undefined)).toBe("in_stock");
    });

    it("returns in_stock for whitespace-only status", () => {
      expect(normalizeStatus("   ", undefined)).toBe("in_stock");
    });

    it("returns in_stock for unrecognized status", () => {
      expect(normalizeStatus("unknown", undefined)).toBe("in_stock");
      expect(normalizeStatus("pending", undefined)).toBe("in_stock");
    });

    it("infers sold status from sale price when status is missing", () => {
      expect(normalizeStatus(undefined, "5000")).toBe("sold");
      expect(normalizeStatus("", "5000")).toBe("sold");
    });

    it("does not infer sold from invalid sale price", () => {
      expect(normalizeStatus(undefined, "")).toBe("in_stock");
      expect(normalizeStatus(undefined, "N/A")).toBe("in_stock");
    });

    it("uses explicit status over sale price inference", () => {
      expect(normalizeStatus("for sale", "5000")).toBe("in_stock");
    });
  });
});

describe("parseNumber", () => {
  describe("standard formats", () => {
    it("parses integers", () => {
      expect(parseNumber("5000")).toBe(5000);
      expect(parseNumber("0")).toBe(0);
      expect(parseNumber("123456789")).toBe(123456789);
    });

    it("parses decimals", () => {
      expect(parseNumber("5000.50")).toBe(5000.5);
      expect(parseNumber("0.99")).toBe(0.99);
      expect(parseNumber("123.456")).toBe(123.456);
    });

    it("parses negative numbers", () => {
      expect(parseNumber("-500")).toBe(-500);
      expect(parseNumber("-123.45")).toBe(-123.45);
    });
  });

  describe("currency formats", () => {
    it("strips dollar signs", () => {
      expect(parseNumber("$5000")).toBe(5000);
      expect(parseNumber("$5,000.00")).toBe(5000);
    });

    it("strips commas", () => {
      expect(parseNumber("5,000")).toBe(5000);
      expect(parseNumber("1,234,567.89")).toBe(1234567.89);
    });

    it("handles mixed formatting", () => {
      expect(parseNumber("$12,500.00")).toBe(12500);
      expect(parseNumber("$ 5,000")).toBe(5000);
    });
  });

  describe("edge cases", () => {
    it("returns null for undefined", () => {
      expect(parseNumber(undefined)).toBeNull();
    });

    it("returns null for empty string", () => {
      expect(parseNumber("")).toBeNull();
      expect(parseNumber("   ")).toBeNull();
    });

    it("returns null for non-numeric strings", () => {
      expect(parseNumber("N/A")).toBeNull();
      expect(parseNumber("TBD")).toBeNull();
      expect(parseNumber("abc")).toBeNull();
    });

    it("extracts numbers from mixed content", () => {
      expect(parseNumber("$4,200")).toBe(4200);
      expect(parseNumber("approx 5000")).toBe(5000);
    });
  });
});

describe("parseDate", () => {
  describe("ISO format", () => {
    it("parses YYYY-MM-DD format", () => {
      const date = parseDate("2024-03-15");
      expect(date).toBeInstanceOf(Date);
      expect(date?.getUTCFullYear()).toBe(2024);
      expect(date?.getUTCMonth()).toBe(2); // March is month 2 (0-indexed)
      expect(date?.getUTCDate()).toBe(15);
    });

    it("parses full ISO datetime", () => {
      const date = parseDate("2024-03-15T10:30:00Z");
      expect(date).toBeInstanceOf(Date);
      expect(date?.getUTCFullYear()).toBe(2024);
    });
  });

  describe("US format (MM/DD/YYYY)", () => {
    it("parses MM/DD/YYYY format", () => {
      const date = parseDate("03/15/2024");
      expect(date).toBeInstanceOf(Date);
      expect(date?.getFullYear()).toBe(2024);
      expect(date?.getMonth()).toBe(2);
      expect(date?.getDate()).toBe(15);
    });

    it("parses single-digit month and day", () => {
      const date = parseDate("1/5/2024");
      expect(date).toBeInstanceOf(Date);
      expect(date?.getMonth()).toBe(0); // January
      expect(date?.getDate()).toBe(5);
    });
  });

  describe("European format (DD-MM-YYYY)", () => {
    it("parses DD-MM-YYYY format", () => {
      const date = parseDate("15-03-2024");
      expect(date).toBeInstanceOf(Date);
      expect(date?.getFullYear()).toBe(2024);
      expect(date?.getMonth()).toBe(2);
      expect(date?.getDate()).toBe(15);
    });
  });

  describe("YYYY/MM/DD format", () => {
    it("parses YYYY/MM/DD format", () => {
      const date = parseDate("2024/03/15");
      expect(date).toBeInstanceOf(Date);
      expect(date?.getFullYear()).toBe(2024);
      expect(date?.getMonth()).toBe(2);
      expect(date?.getDate()).toBe(15);
    });
  });

  describe("edge cases", () => {
    it("returns null for undefined", () => {
      expect(parseDate(undefined)).toBeNull();
    });

    it("returns null for empty string", () => {
      expect(parseDate("")).toBeNull();
      expect(parseDate("   ")).toBeNull();
    });

    it("handles natural language dates", () => {
      // This depends on JS Date parsing, may vary by environment
      const date = parseDate("Jan 15 2024");
      expect(date).toBeInstanceOf(Date);
    });
  });
});

describe("cleanString", () => {
  it("trims whitespace", () => {
    expect(cleanString("  hello  ")).toBe("hello");
    expect(cleanString("\n\ttest\n\t")).toBe("test");
  });

  it("returns null for empty strings", () => {
    expect(cleanString("")).toBeNull();
    expect(cleanString("   ")).toBeNull();
  });

  it("returns null for undefined", () => {
    expect(cleanString(undefined)).toBeNull();
  });

  it("preserves non-empty strings", () => {
    expect(cleanString("Rolex")).toBe("Rolex");
    expect(cleanString("Box & Papers")).toBe("Box & Papers");
  });
});

describe("validateRequiredFields", () => {
  it("returns valid for complete data", () => {
    const row = { brand: "Rolex", model: "Submariner" };
    const result = validateRequiredFields(row, ["brand", "model"]);
    expect(result.valid).toBe(true);
    expect(result.missing).toEqual([]);
  });

  it("returns invalid with missing fields", () => {
    const row = { brand: "Rolex", model: "" };
    const result = validateRequiredFields(row, ["brand", "model"]);
    expect(result.valid).toBe(false);
    expect(result.missing).toEqual(["model"]);
  });

  it("returns all missing fields", () => {
    const row = { brand: "", model: "" };
    const result = validateRequiredFields(row, ["brand", "model"]);
    expect(result.valid).toBe(false);
    expect(result.missing).toEqual(["brand", "model"]);
  });

  it("handles whitespace-only values as missing", () => {
    const row = { brand: "   ", model: "Submariner" };
    const result = validateRequiredFields(row, ["brand", "model"]);
    expect(result.valid).toBe(false);
    expect(result.missing).toEqual(["brand"]);
  });
});

describe("transformInventoryRow", () => {
  it("transforms a complete row", () => {
    const row = {
      brand: "Rolex",
      model: "Submariner",
      reference: "116610LN",
      serial: "7R4X9821",
      year: "2019",
      caseMaterial: "Steel",
      dialColor: "Black",
      condition: "Excellent",
      accessories: "Box & Papers",
      purchaseDate: "2024-01-15",
      purchaseSource: "Dealer",
      purchasePrice: "$9,500",
      status: "for sale",
    };

    const { data, customData } = transformInventoryRow(row);

    expect(data.brand).toBe("Rolex");
    expect(data.model).toBe("Submariner");
    expect(data.reference).toBe("116610LN");
    expect(data.purchasePrice).toBe(9500);
    expect(data.status).toBe("in_stock");
    expect(data.purchaseDate).toBeInstanceOf(Date);
    expect(Object.keys(customData)).toHaveLength(0);
  });

  it("handles asking price as custom data", () => {
    const row = {
      brand: "Rolex",
      model: "Submariner",
      askingPrice: "$12,500",
    };

    const { data, customData } = transformInventoryRow(row);

    expect(data.brand).toBe("Rolex");
    expect(customData["Asking Price"]).toBe("$12,500");
  });

  it("handles _customData JSON", () => {
    const row = {
      brand: "Rolex",
      model: "Submariner",
      _customData: JSON.stringify({ "Custom Field": "Custom Value" }),
    };

    const { customData } = transformInventoryRow(row);

    expect(customData["Custom Field"]).toBe("Custom Value");
  });

  it("infers sold status from sale price", () => {
    const row = {
      brand: "Rolex",
      model: "Submariner",
      salePrice: "11000",
    };

    const { data } = transformInventoryRow(row);

    expect(data.status).toBe("sold");
    expect(data.salePrice).toBe(11000);
  });

  it("handles empty/missing values gracefully", () => {
    const row = {
      brand: "Rolex",
      model: "Submariner",
      reference: "",
      serial: "   ",
      purchasePrice: "N/A",
    };

    const { data } = transformInventoryRow(row);

    expect(data.brand).toBe("Rolex");
    expect(data.model).toBe("Submariner");
    expect(data.reference).toBeNull();
    expect(data.serial).toBeNull();
    expect(data.purchasePrice).toBeNull();
  });
});
