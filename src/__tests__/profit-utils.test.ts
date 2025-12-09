import {
  calculateTotalCost,
  calculateTotalFees,
  calculateNetProceeds,
  calculateProfit,
  calculateROI,
  calculateMargin,
  WatchFinancials,
} from "@/lib/profit-utils";

describe("Profit Calculations", () => {
  const soldWatch: WatchFinancials = {
    purchasePrice: 10000,
    purchaseShippingCost: 50,
    additionalCosts: 200,
    salePrice: 12500,
    platformFees: 1250,
    shippingCosts: 75,
    marketingCosts: 25,
    salesTax: 0,
  };

  const unsoldWatch: WatchFinancials = {
    purchasePrice: 5000,
    purchaseShippingCost: 50,
    additionalCosts: 0,
    salePrice: null,
    platformFees: null,
    shippingCosts: null,
    marketingCosts: null,
    salesTax: null,
  };

  describe("calculateTotalCost", () => {
    it("sums purchase price, shipping, and additional costs", () => {
      expect(calculateTotalCost(soldWatch)).toBe(10250);
    });

    it("handles null values as zero", () => {
      expect(calculateTotalCost(unsoldWatch)).toBe(5050);
    });

    it("returns 0 for watch with no costs", () => {
      const noCost: WatchFinancials = {
        purchasePrice: null,
        purchaseShippingCost: null,
        additionalCosts: null,
        salePrice: null,
        platformFees: null,
        shippingCosts: null,
        marketingCosts: null,
        salesTax: null,
      };
      expect(calculateTotalCost(noCost)).toBe(0);
    });
  });

  describe("calculateTotalFees", () => {
    it("sums platform fees, shipping, and marketing", () => {
      expect(calculateTotalFees(soldWatch)).toBe(1350);
    });

    it("handles null values as zero", () => {
      expect(calculateTotalFees(unsoldWatch)).toBe(0);
    });
  });

  describe("calculateNetProceeds", () => {
    it("subtracts fees from sale price", () => {
      expect(calculateNetProceeds(soldWatch)).toBe(11150);
    });

    it("returns 0 for unsold watch", () => {
      expect(calculateNetProceeds(unsoldWatch)).toBe(0);
    });
  });

  describe("calculateProfit", () => {
    it("calculates profit correctly", () => {
      // Net proceeds (11150) - Total cost (10250) = 900
      expect(calculateProfit(soldWatch)).toBe(900);
    });

    it("returns 0 for unsold watch", () => {
      expect(calculateProfit(unsoldWatch)).toBe(0);
    });

    it("handles negative profit (loss)", () => {
      const lossWatch: WatchFinancials = {
        ...soldWatch,
        salePrice: 9000,
      };
      expect(calculateProfit(lossWatch)).toBeLessThan(0);
    });
  });

  describe("calculateROI", () => {
    it("calculates ROI as percentage", () => {
      // Profit (900) / Cost (10250) * 100 = 8.78%
      expect(calculateROI(soldWatch)).toBeCloseTo(8.78, 1);
    });

    it("returns 0 for unsold watch", () => {
      expect(calculateROI(unsoldWatch)).toBe(0);
    });

    it("returns 0 when cost is zero", () => {
      const freWatch: WatchFinancials = {
        ...soldWatch,
        purchasePrice: 0,
        purchaseShippingCost: 0,
        additionalCosts: 0,
      };
      expect(calculateROI(freWatch)).toBe(0);
    });
  });

  describe("calculateMargin", () => {
    it("calculates profit margin as percentage of sale price", () => {
      // Profit (900) / Sale (12500) * 100 = 7.2%
      expect(calculateMargin(soldWatch)).toBeCloseTo(7.2, 1);
    });

    it("returns 0 for unsold watch", () => {
      expect(calculateMargin(unsoldWatch)).toBe(0);
    });
  });

  describe("real-world scenarios", () => {
    it("handles high-margin flip", () => {
      const flip: WatchFinancials = {
        purchasePrice: 3000,
        purchaseShippingCost: 0,
        additionalCosts: 0,
        salePrice: 4500,
        platformFees: 450,
        shippingCosts: 50,
        marketingCosts: 0,
        salesTax: 0,
      };
      expect(calculateProfit(flip)).toBe(1000);
      expect(calculateROI(flip)).toBeCloseTo(33.33, 1);
    });

    it("handles break-even sale", () => {
      const breakEven: WatchFinancials = {
        purchasePrice: 5000,
        purchaseShippingCost: 50,
        additionalCosts: 100,
        salePrice: 5665,
        platformFees: 515,
        shippingCosts: 0,
        marketingCosts: 0,
        salesTax: 0,
      };
      expect(calculateProfit(breakEven)).toBe(0);
    });
  });
});
