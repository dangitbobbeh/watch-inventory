import { prisma } from "@/lib/prisma";
import { getRequiredSession } from "@/lib/session";
import EmptyState, { emptyStates } from "../components/empty-state";

export default async function ReportsPage() {
  const session = await getRequiredSession();

  const watches = await prisma.watch.findMany({
    where: { userId: session.user.id },
  });

  const sold = watches.filter((w) => w.status === "sold");
  const inStock = watches.filter((w) => w.status === "in_stock");

  // If no watches at all, show empty state
  if (watches.length === 0) {
    return (
      <main className="max-w-6xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
          Reports
        </h1>
        <EmptyState {...emptyStates.inventory} />
      </main>
    );
  }

  // If no sold watches, show different empty state
  if (sold.length === 0) {
    return (
      <main className="max-w-6xl mx-auto p-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
          Reports
        </h1>
        <EmptyState {...emptyStates.reports} />
      </main>
    );
  }

  const soldWithProfit = sold.map((w) => {
    const salePrice = Number(w.salePrice) || 0;
    const purchasePrice = Number(w.purchasePrice) || 0;
    const purchaseShipping = Number(w.purchaseShippingCost) || 0;
    const additionalCosts = Number(w.additionalCosts) || 0;
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

    return { ...w, profit, totalCost, daysToSell };
  });

  const profitBySource = soldWithProfit.reduce((acc, w) => {
    const source = w.purchaseSource || "Unknown";
    if (!acc[source]) {
      acc[source] = { profit: 0, count: 0, totalCost: 0 };
    }
    acc[source].profit += w.profit;
    acc[source].count += 1;
    acc[source].totalCost += w.totalCost;
    return acc;
  }, {} as Record<string, { profit: number; count: number; totalCost: number }>);

  const profitByPlatform = soldWithProfit.reduce((acc, w) => {
    const platform = w.salePlatform || "Unknown";
    if (!acc[platform]) {
      acc[platform] = { profit: 0, count: 0, revenue: 0 };
    }
    acc[platform].profit += w.profit;
    acc[platform].count += 1;
    acc[platform].revenue += Number(w.salePrice) || 0;
    return acc;
  }, {} as Record<string, { profit: number; count: number; revenue: number }>);

  const profitByBrand = soldWithProfit.reduce((acc, w) => {
    const brand = w.brand;
    if (!acc[brand]) {
      acc[brand] = { profit: 0, count: 0, avgDays: 0, totalDays: 0 };
    }
    acc[brand].profit += w.profit;
    acc[brand].count += 1;
    if (w.daysToSell) {
      acc[brand].totalDays += w.daysToSell;
    }
    return acc;
  }, {} as Record<string, { profit: number; count: number; avgDays: number; totalDays: number }>);

  Object.keys(profitByBrand).forEach((brand) => {
    const b = profitByBrand[brand];
    b.avgDays = b.count > 0 ? Math.round(b.totalDays / b.count) : 0;
  });

  const monthlyProfit = soldWithProfit.reduce((acc, w) => {
    if (!w.saleDate) return acc;
    const date = new Date(w.saleDate);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
    if (!acc[key]) {
      acc[key] = { profit: 0, count: 0, revenue: 0 };
    }
    acc[key].profit += w.profit;
    acc[key].count += 1;
    acc[key].revenue += Number(w.salePrice) || 0;
    return acc;
  }, {} as Record<string, { profit: number; count: number; revenue: number }>);

  const sortedMonths = Object.entries(monthlyProfit)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12);

  const topByProfit = [...soldWithProfit]
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 5);

  const worstByProfit = [...soldWithProfit]
    .sort((a, b) => a.profit - b.profit)
    .slice(0, 5);

  const now = new Date();
  const inStockAging = inStock
    .map((w) => {
      const daysInStock = w.purchaseDate
        ? Math.round(
            (now.getTime() - new Date(w.purchaseDate).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : 0;
      const totalCost =
        (Number(w.purchasePrice) || 0) +
        (Number(w.purchaseShippingCost) || 0) +
        (Number(w.additionalCosts) || 0);
      return { ...w, daysInStock, totalCost };
    })
    .sort((a, b) => b.daysInStock - a.daysInStock);

  const totalProfit = soldWithProfit.reduce((sum, w) => sum + w.profit, 0);
  const avgProfit = sold.length > 0 ? totalProfit / sold.length : 0;
  const avgDaysToSell =
    soldWithProfit.filter((w) => w.daysToSell).length > 0
      ? soldWithProfit.reduce((sum, w) => sum + (w.daysToSell || 0), 0) /
        soldWithProfit.filter((w) => w.daysToSell).length
      : 0;
  const inventoryValue = inStockAging.reduce((sum, w) => sum + w.totalCost, 0);

  return (
    <main className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
        Reports
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <SummaryCard
          title="Total Profit"
          value={formatCurrency(totalProfit)}
          color={totalProfit >= 0 ? "green" : "red"}
        />
        <SummaryCard
          title="Avg Profit/Sale"
          value={formatCurrency(avgProfit)}
          color={avgProfit >= 0 ? "green" : "red"}
        />
        <SummaryCard
          title="Avg Days to Sell"
          value={`${Math.round(avgDaysToSell)} days`}
        />
        <SummaryCard
          title="Inventory Value"
          value={formatCurrency(inventoryValue)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Monthly Performance
          </h2>
          {sortedMonths.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">
              No sales data yet.
            </p>
          ) : (
            <div className="space-y-2">
              {sortedMonths.map(([month, data]) => (
                <div
                  key={month}
                  className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700"
                >
                  <span className="text-gray-700 dark:text-gray-300">
                    {formatMonth(month)}
                  </span>
                  <div className="text-right">
                    <span
                      className={`font-semibold ${
                        data.profit >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {formatCurrency(data.profit)}
                    </span>
                    <span className="text-gray-400 dark:text-gray-500 text-sm ml-2">
                      ({data.count} sold)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Profit by Source
          </h2>
          {Object.keys(profitBySource).length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">
              No sales data yet.
            </p>
          ) : (
            <div className="space-y-2">
              {Object.entries(profitBySource)
                .sort(([, a], [, b]) => b.profit - a.profit)
                .map(([source, data]) => (
                  <div
                    key={source}
                    className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700"
                  >
                    <span className="text-gray-700 dark:text-gray-300">
                      {source}
                    </span>
                    <div className="text-right">
                      <span
                        className={`font-semibold ${
                          data.profit >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {formatCurrency(data.profit)}
                      </span>
                      <span className="text-gray-400 dark:text-gray-500 text-sm ml-2">
                        ({data.count} sold)
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </section>

        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Profit by Platform
          </h2>
          {Object.keys(profitByPlatform).length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">
              No sales data yet.
            </p>
          ) : (
            <div className="space-y-2">
              {Object.entries(profitByPlatform)
                .sort(([, a], [, b]) => b.profit - a.profit)
                .map(([platform, data]) => (
                  <div
                    key={platform}
                    className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700"
                  >
                    <span className="text-gray-700 dark:text-gray-300">
                      {platform}
                    </span>
                    <div className="text-right">
                      <span
                        className={`font-semibold ${
                          data.profit >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {formatCurrency(data.profit)}
                      </span>
                      <span className="text-gray-400 dark:text-gray-500 text-sm ml-2">
                        ({data.count} sold)
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </section>

        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Profit by Brand
          </h2>
          {Object.keys(profitByBrand).length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">
              No sales data yet.
            </p>
          ) : (
            <div className="space-y-2">
              {Object.entries(profitByBrand)
                .sort(([, a], [, b]) => b.profit - a.profit)
                .map(([brand, data]) => (
                  <div
                    key={brand}
                    className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700"
                  >
                    <span className="text-gray-700 dark:text-gray-300">
                      {brand}
                    </span>
                    <div className="text-right">
                      <span
                        className={`font-semibold ${
                          data.profit >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {formatCurrency(data.profit)}
                      </span>
                      <span className="text-gray-400 dark:text-gray-500 text-sm ml-2">
                        ({data.count} sold, ~{data.avgDays} days)
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </section>

        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Top Performers
          </h2>
          {topByProfit.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">
              No sales data yet.
            </p>
          ) : (
            <div className="space-y-2">
              {topByProfit.map((watch) => (
                <div
                  key={watch.id}
                  className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700"
                >
                  <span className="text-gray-700 dark:text-gray-300">
                    {watch.brand} {watch.model}
                  </span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(watch.profit)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Lowest Performers
          </h2>
          {worstByProfit.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">
              No sales data yet.
            </p>
          ) : (
            <div className="space-y-2">
              {worstByProfit.map((watch) => (
                <div
                  key={watch.id}
                  className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700"
                >
                  <span className="text-gray-700 dark:text-gray-300">
                    {watch.brand} {watch.model}
                  </span>
                  <span
                    className={`font-semibold ${
                      watch.profit >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {formatCurrency(watch.profit)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Inventory Aging
          </h2>
          {inStockAging.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">
              No watches currently in stock.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="text-left p-3 text-gray-700 dark:text-gray-300 font-medium">
                      Watch
                    </th>
                    <th className="text-left p-3 text-gray-700 dark:text-gray-300 font-medium">
                      Source
                    </th>
                    <th className="text-right p-3 text-gray-700 dark:text-gray-300 font-medium">
                      Cost
                    </th>
                    <th className="text-right p-3 text-gray-700 dark:text-gray-300 font-medium">
                      Days in Stock
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {inStockAging.slice(0, 10).map((watch) => (
                    <tr
                      key={watch.id}
                      className="border-b border-gray-100 dark:border-gray-700"
                    >
                      <td className="p-3 text-gray-900 dark:text-white">
                        {watch.brand} {watch.model}
                      </td>
                      <td className="p-3 text-gray-600 dark:text-gray-400">
                        {watch.purchaseSource || "—"}
                      </td>
                      <td className="p-3 text-right text-gray-900 dark:text-white">
                        {formatCurrency(watch.totalCost)}
                      </td>
                      <td className="p-3 text-right">
                        <span
                          className={
                            watch.daysInStock > 90
                              ? "text-red-600 font-medium"
                              : "text-gray-600 dark:text-gray-400"
                          }
                        >
                          {watch.daysInStock} days
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function SummaryCard({
  title,
  value,
  color,
}: {
  title: string;
  value: string;
  color?: "green" | "red";
}) {
  const colorClass =
    color === "green"
      ? "text-green-600"
      : color === "red"
      ? "text-red-600"
      : "text-gray-900 dark:text-white";
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <p className="text-gray-500 dark:text-gray-400 text-sm">{title}</p>
      <p className={`text-xl font-semibold mt-1 ${colorClass}`}>{value}</p>
    </div>
  );
}

function formatCurrency(value: number): string {
  return `${value >= 0 ? "" : "-"}$${Math.abs(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatMonth(key: string): string {
  const [year, month] = key.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}
