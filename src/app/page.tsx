import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getRequiredSession } from "@/lib/session";
import EmptyState, { emptyStates } from "./components/empty-state";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

type SerializedWatch = {
  id: string;
  brand: string;
  model: string;
  reference: string | null;
  status: string;
  purchaseDate: Date | null;
  saleDate: Date | null;
  purchasePrice: number | null;
  additionalCosts: number | null;
  purchaseShippingCost: number | null;
  salePrice: number | null;
  platformFees: number | null;
  marketingCosts: number | null;
  shippingCosts: number | null;
  salesTax: number | null;
};

export default async function Home() {
  const session = await getRequiredSession();

  const watchesRaw = await prisma.watch.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  const watches: SerializedWatch[] = watchesRaw.map((w) => ({
    id: w.id,
    brand: w.brand,
    model: w.model,
    reference: w.reference,
    status: w.status,
    purchaseDate: w.purchaseDate,
    saleDate: w.saleDate,
    purchasePrice: w.purchasePrice ? Number(w.purchasePrice) : null,
    additionalCosts: w.additionalCosts ? Number(w.additionalCosts) : null,
    purchaseShippingCost: w.purchaseShippingCost
      ? Number(w.purchaseShippingCost)
      : null,
    salePrice: w.salePrice ? Number(w.salePrice) : null,
    platformFees: w.platformFees ? Number(w.platformFees) : null,
    marketingCosts: w.marketingCosts ? Number(w.marketingCosts) : null,
    shippingCosts: w.shippingCosts ? Number(w.shippingCosts) : null,
    salesTax: w.salesTax ? Number(w.salesTax) : null,
  }));

  const inStock = watches.filter((w) => w.status === "in_stock");
  const sold = watches.filter((w) => w.status === "sold");

  // Last 5 in (by purchase date)
  const recentIn = [...watches]
    .filter((w) => w.purchaseDate)
    .sort(
      (a, b) =>
        new Date(b.purchaseDate!).getTime() -
        new Date(a.purchaseDate!).getTime()
    )
    .slice(0, 5);

  // Last 5 out (by sale date)
  const recentOut = [...sold]
    .filter((w) => w.saleDate)
    .sort(
      (a, b) =>
        new Date(b.saleDate!).getTime() - new Date(a.saleDate!).getTime()
    )
    .slice(0, 5);

  const inStockCount = inStock.length;
  const soldCount = sold.length;

  const inventoryValue = inStock.reduce((sum, w) => {
    const purchase = w.purchasePrice || 0;
    const shipping = w.purchaseShippingCost || 0;
    const additional = w.additionalCosts || 0;
    return sum + purchase + shipping + additional;
  }, 0);

  const totalProfit = sold.reduce((sum, w) => {
    const salePrice = w.salePrice || 0;
    const purchasePrice = w.purchasePrice || 0;
    const purchaseShipping = w.purchaseShippingCost || 0;
    const additionalCosts = w.additionalCosts || 0;
    const platformFees = w.platformFees || 0;
    const marketingCosts = w.marketingCosts || 0;
    const shippingCosts = w.shippingCosts || 0;
    const salesTax = w.salesTax || 0;

    const totalCost = purchasePrice + purchaseShipping + additionalCosts;
    const totalSaleCosts =
      platformFees + marketingCosts + shippingCosts + salesTax;
    const profit = salePrice - totalSaleCosts - totalCost;

    return sum + profit;
  }, 0);

  const totalRevenue = sold.reduce((sum, w) => {
    return sum + (w.salePrice || 0);
  }, 0);

  const avgProfit = soldCount > 0 ? totalProfit / soldCount : 0;

  // Check if user has any data
  const hasData = watches.length > 0;

  if (!hasData) {
    return (
      <main className="max-w-6xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
        </div>
        <EmptyState {...emptyStates.inventory} />
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <DashboardCard
          title="In Stock"
          value={inStockCount}
          subtitle={`$${inventoryValue.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })} value`}
        />
        <DashboardCard
          title="Total Sold"
          value={soldCount}
          subtitle={`$${totalRevenue.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })} revenue`}
        />
        <DashboardCard
          title="Total Profit"
          value={`$${totalProfit.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          valueColor={totalProfit >= 0 ? "text-green-600" : "text-red-600"}
        />
        <DashboardCard
          title="Avg Profit / Sale"
          value={`$${avgProfit.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`}
          valueColor={avgProfit >= 0 ? "text-green-600" : "text-red-600"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section>
          <div className="flex items-center gap-2 mb-4">
            <ArrowDownLeft className="text-green-600" size={20} />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Recent Acquisitions
            </h2>
          </div>
          {recentIn.length > 0 ? (
            <WatchList watches={recentIn} showDate="purchase" />
          ) : (
            <EmptyState {...emptyStates.recentIn} />
          )}
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <ArrowUpRight className="text-blue-600" size={20} />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Recent Sales
            </h2>
          </div>
          {recentOut.length > 0 ? (
            <WatchList watches={recentOut} showDate="sale" />
          ) : (
            <EmptyState {...emptyStates.recentOut} />
          )}
        </section>
      </div>
    </main>
  );
}

function DashboardCard({
  title,
  value,
  subtitle,
  valueColor = "text-gray-900 dark:text-white",
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  valueColor?: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
      <p className="text-gray-500 dark:text-gray-400 text-sm">{title}</p>
      <p className={`text-2xl font-semibold mt-1 ${valueColor}`}>{value}</p>
      {subtitle && (
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
          {subtitle}
        </p>
      )}
    </div>
  );
}

function WatchList({
  watches,
  showDate,
}: {
  watches: SerializedWatch[];
  showDate: "purchase" | "sale";
}) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <tr>
            <th className="text-left p-4 text-gray-700 dark:text-gray-300 font-semibold text-sm">
              Watch
            </th>
            <th className="text-right p-4 text-gray-700 dark:text-gray-300 font-semibold text-sm">
              {showDate === "purchase" ? "Cost" : "Profit"}
            </th>
            <th className="text-right p-4 text-gray-700 dark:text-gray-300 font-semibold text-sm">
              Date
            </th>
          </tr>
        </thead>
        <tbody>
          {watches.map((watch) => {
            const purchasePrice = watch.purchasePrice || 0;
            const purchaseShipping = watch.purchaseShippingCost || 0;
            const additionalCosts = watch.additionalCosts || 0;
            const salePrice = watch.salePrice || 0;
            const platformFees = watch.platformFees || 0;
            const marketingCosts = watch.marketingCosts || 0;
            const shippingCosts = watch.shippingCosts || 0;
            const salesTax = watch.salesTax || 0;

            const totalCost =
              purchasePrice + purchaseShipping + additionalCosts;
            const totalSaleCosts =
              platformFees + marketingCosts + shippingCosts + salesTax;
            const profit = salePrice - totalSaleCosts - totalCost;

            const date =
              showDate === "purchase" ? watch.purchaseDate : watch.saleDate;
            const formattedDate = date
              ? new Date(date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "—";

            return (
              <tr
                key={watch.id}
                className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <td className="p-4">
                  <Link
                    href={`/inventory/${watch.id}`}
                    className="text-blue-700 dark:text-blue-400 hover:underline font-medium"
                  >
                    {watch.brand} {watch.model}
                  </Link>
                  {watch.reference && (
                    <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">
                      {watch.reference}
                    </span>
                  )}
                </td>
                <td className="p-4 text-right tabular-nums">
                  {showDate === "purchase" ? (
                    <span className="text-gray-900 dark:text-white">
                      $
                      {totalCost.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  ) : (
                    <span
                      className={
                        profit >= 0 ? "text-green-600" : "text-red-600"
                      }
                    >
                      {profit >= 0 ? "+" : ""}$
                      {profit.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  )}
                </td>
                <td className="p-4 text-right text-gray-500 dark:text-gray-400 text-sm">
                  {formattedDate}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
