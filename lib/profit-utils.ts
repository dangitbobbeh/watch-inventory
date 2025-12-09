export interface WatchFinancials {
  purchasePrice: number | null;
  purchaseShippingCost: number | null;
  additionalCosts: number | null;
  salePrice: number | null;
  platformFees: number | null;
  shippingCosts: number | null;
  marketingCosts: number | null;
  salesTax: number | null;
}

export function calculateTotalCost(watch: WatchFinancials): number {
  return (
    (watch.purchasePrice || 0) +
    (watch.purchaseShippingCost || 0) +
    (watch.additionalCosts || 0)
  );
}

export function calculateTotalFees(watch: WatchFinancials): number {
  return (
    (watch.platformFees || 0) +
    (watch.shippingCosts || 0) +
    (watch.marketingCosts || 0)
  );
}

export function calculateNetProceeds(watch: WatchFinancials): number {
  if (!watch.salePrice) return 0;
  return watch.salePrice - calculateTotalFees(watch);
}

export function calculateProfit(watch: WatchFinancials): number {
  if (!watch.salePrice) return 0;
  return calculateNetProceeds(watch) - calculateTotalCost(watch);
}

export function calculateROI(watch: WatchFinancials): number {
  const cost = calculateTotalCost(watch);
  if (cost === 0) return 0;
  const profit = calculateProfit(watch);
  return (profit / cost) * 100;
}

export function calculateMargin(watch: WatchFinancials): number {
  if (!watch.salePrice || watch.salePrice === 0) return 0;
  const profit = calculateProfit(watch);
  return (profit / watch.salePrice) * 100;
}
