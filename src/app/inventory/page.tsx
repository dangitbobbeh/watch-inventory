import Link from "next/link";
import { prisma } from "@/lib/prisma";
import InventoryFilters from "./inventory-filters";

type SearchParams = {
  q?: string;
  status?: string;
  source?: string;
  platform?: string;
};

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const { q, status, source, platform } = params;

  // Build the where clause dynamically
  const where: any = {};

  if (q) {
    where.OR = [
      { brand: { contains: q, mode: "insensitive" } },
      { model: { contains: q, mode: "insensitive" } },
      { reference: { contains: q, mode: "insensitive" } },
      { serial: { contains: q, mode: "insensitive" } },
    ];
  }

  if (status) {
    where.status = status;
  }

  if (source) {
    where.purchaseSource = { contains: source, mode: "insensitive" };
  }

  if (platform) {
    where.salePlatform = { contains: platform, mode: "insensitive" };
  }

  const watches = await prisma.watch.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  // Get unique sources and platforms for filter dropdowns
  const allWatches = await prisma.watch.findMany({
    select: { purchaseSource: true, salePlatform: true },
  });

  const sources = [
    ...new Set(allWatches.map((w) => w.purchaseSource).filter(Boolean)),
  ] as string[];
  const platforms = [
    ...new Set(allWatches.map((w) => w.salePlatform).filter(Boolean)),
  ] as string[];

  return (
    <main className="max-w-6xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Inventory</h1>
      </div>

      <InventoryFilters
        sources={sources}
        platforms={platforms}
        currentFilters={params}
      />

      <p className="text-sm text-gray-500 mb-4">
        {watches.length} {watches.length === 1 ? "watch" : "watches"} found
      </p>

      {watches.length === 0 ? (
        <p className="text-gray-500">No watches match your filters.</p>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="text-left p-4 text-gray-900 font-semibold">
                  Brand
                </th>
                <th className="text-left p-4 text-gray-900 font-semibold">
                  Model
                </th>
                <th className="text-left p-4 text-gray-900 font-semibold">
                  Reference
                </th>
                <th className="text-left p-4 text-gray-900 font-semibold">
                  Source
                </th>
                <th className="text-left p-4 text-gray-900 font-semibold">
                  Status
                </th>
                <th className="text-right p-4 text-gray-900 font-semibold">
                  Cost
                </th>
                <th className="text-right p-4 text-gray-900 font-semibold">
                  Profit
                </th>
              </tr>
            </thead>
            <tbody>
              {watches.map((watch) => {
                const purchasePrice = Number(watch.purchasePrice) || 0;
                const purchaseShipping =
                  Number(watch.purchaseShippingCost) || 0;
                const additionalCosts = Number(watch.additionalCosts) || 0;
                const salePrice = Number(watch.salePrice) || 0;
                const platformFees = Number(watch.platformFees) || 0;
                const marketingCosts = Number(watch.marketingCosts) || 0;
                const shippingCosts = Number(watch.shippingCosts) || 0;
                const salesTax = Number(watch.salesTax) || 0;

                const totalCost =
                  purchasePrice + purchaseShipping + additionalCosts;
                const totalSaleCosts =
                  platformFees + marketingCosts + shippingCosts + salesTax;
                const profit = watch.salePrice
                  ? salePrice - totalSaleCosts - totalCost
                  : null;

                return (
                  <tr key={watch.id} className="border-b hover:bg-gray-50">
                    <td className="p-4 text-gray-900">
                      <Link
                        href={`/inventory/${watch.id}`}
                        className="text-blue-700 hover:text-blue-900 hover:underline font-medium"
                      >
                        {watch.brand}
                      </Link>
                    </td>
                    <td className="p-4 text-gray-900">{watch.model}</td>
                    <td className="p-4 text-gray-600">
                      {watch.reference || "—"}
                    </td>
                    <td className="p-4 text-gray-600">
                      {watch.purchaseSource || "—"}
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
      )}
    </main>
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
