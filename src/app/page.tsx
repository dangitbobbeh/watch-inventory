import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const watches = await prisma.watch.findMany();

  // Calculate stats
  const inStock = watches.filter((w) => w.status === "in_stock");
  const sold = watches.filter((w) => w.status === "sold");

  const inStockCount = inStock.length;
  const soldCount = sold.length;

  // Inventory value = purchase price + additional costs for in-stock watches
  const inventoryValue = inStock.reduce((sum, w) => {
    const purchase = Number(w.purchasePrice) || 0;
    const additional = Number(w.additionalCosts) || 0;
    return sum + purchase + additional;
  }, 0);

  // Total profit from sold watches
  const totalProfit = sold.reduce((sum, w) => {
    const salePrice = Number(w.salePrice) || 0;
    const purchasePrice = Number(w.purchasePrice) || 0;
    const additionalCosts = Number(w.additionalCosts) || 0;
    const platformFees = Number(w.platformFees) || 0;
    const marketingCosts = Number(w.marketingCosts) || 0;
    const shippingCosts = Number(w.shippingCosts) || 0;
    const salesTax = Number(w.salesTax) || 0;

    const totalCost = purchasePrice + additionalCosts;
    const totalSaleCosts =
      platformFees + marketingCosts + shippingCosts + salesTax;
    const profit = salePrice - totalSaleCosts - totalCost;

    return sum + profit;
  }, 0);

  // Total revenue (sum of all sale prices)
  const totalRevenue = sold.reduce((sum, w) => {
    return sum + (Number(w.salePrice) || 0);
  }, 0);

  // Average profit per sale
  const avgProfit = soldCount > 0 ? totalProfit / soldCount : 0;

  return (
    <main className="max-w-6xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Watch Inventory</h1>
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

      {/* Recent Activity */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <RecentWatches watches={watches.slice(0, 5)} />
      </section>
    </main>
  );
}

function DashboardCard({
  title,
  value,
  subtitle,
  valueColor = "text-gray-900",
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  valueColor?: string;
}) {
  return (
    <div className="bg-white border rounded-lg p-6 shadow-sm">
      <p className="text-gray-500 text-sm">{title}</p>
      <p className={`text-2xl font-semibold mt-1 ${valueColor}`}>{value}</p>
      {subtitle && <p className="text-gray-400 text-sm mt-1">{subtitle}</p>}
    </div>
  );
}

function RecentWatches({ watches }: { watches: any[] }) {
  if (watches.length === 0) {
    return <p className="text-gray-500">No watches yet. Add your first one!</p>;
  }

  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-100 border-b">
          <tr>
            <th className="text-left p-4 text-gray-900 font-semibold">Watch</th>
            <th className="text-left p-4 text-gray-900 font-semibold">
              Status
            </th>
            <th className="text-right p-4 text-gray-900 font-semibold">Cost</th>
            <th className="text-right p-4 text-gray-900 font-semibold">Sale</th>
            <th className="text-right p-4 text-gray-900 font-semibold">
              Profit
            </th>
          </tr>
        </thead>
        <tbody>
          {watches.map((watch) => {
            const purchasePrice = Number(watch.purchasePrice) || 0;
            const additionalCosts = Number(watch.additionalCosts) || 0;
            const salePrice = Number(watch.salePrice) || 0;
            const platformFees = Number(watch.platformFees) || 0;
            const marketingCosts = Number(watch.marketingCosts) || 0;
            const shippingCosts = Number(watch.shippingCosts) || 0;
            const salesTax = Number(watch.salesTax) || 0;

            const totalCost = purchasePrice + additionalCosts;
            const totalSaleCosts =
              platformFees + marketingCosts + shippingCosts + salesTax;
            const profit = watch.salePrice
              ? salePrice - totalSaleCosts - totalCost
              : null;

            return (
              <tr key={watch.id} className="border-b hover:bg-gray-50">
                <td className="p-4">
                  <Link
                    href={`/inventory/${watch.id}`}
                    className="text-blue-700 hover:underline font-medium"
                  >
                    {watch.brand} {watch.model}
                  </Link>
                  {watch.reference && (
                    <span className="text-gray-500 text-sm ml-2">
                      {watch.reference}
                    </span>
                  )}
                </td>
                <td className="p-4">
                  <StatusBadge status={watch.status} />
                </td>
                <td className="p-4 text-right text-gray-900">
                  $
                  {totalCost.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="p-4 text-right text-gray-900">
                  {watch.salePrice
                    ? `$${salePrice.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                    : "—"}
                </td>
                <td className="p-4 text-right">
                  {profit !== null ? (
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
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    in_stock: "bg-green-100 text-green-800",
    sold: "bg-blue-100 text-blue-800",
    traded: "bg-purple-100 text-purple-800",
    consigned: "bg-yellow-100 text-yellow-800",
  };

  return (
    <span
      className={`px-2 py-1 rounded text-sm font-medium ${
        styles[status] || "bg-gray-100"
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
}
