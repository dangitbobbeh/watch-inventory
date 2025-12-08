"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronUp, ChevronDown, Package, Search } from "lucide-react";

type Watch = {
  id: string;
  brand: string;
  model: string;
  reference: string | null;
  status: string;
  purchaseSource: string | null;
  purchasePrice: number | null;
  purchaseShippingCost: number | null;
  additionalCosts: number | null;
  salePrice: number | null;
  platformFees: number | null;
  marketingCosts: number | null;
  shippingCosts: number | null;
  salesTax: number | null;
};

type Props = {
  watches: Watch[];
  sort: string;
  order: string;
  hasFilters?: boolean;
};

export default function InventoryTable({
  watches,
  sort,
  order,
  hasFilters = false,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleSort(field: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (sort === field) {
      params.set("order", order === "asc" ? "desc" : "asc");
    } else {
      params.set("sort", field);
      params.set("order", "asc");
    }
    params.delete("page");

    router.push(`/inventory?${params.toString()}`);
  }

  if (watches.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
        {hasFilters ? (
          <>
            <Search
              className="mx-auto text-gray-300 dark:text-gray-600 mb-4"
              size={48}
            />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No watches found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Try adjusting your search or filters to find what you're looking
              for.
            </p>
            <Link
              href="/inventory"
              className="inline-flex items-center px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </Link>
          </>
        ) : (
          <>
            <Package
              className="mx-auto text-gray-300 dark:text-gray-600 mb-4"
              size={48}
            />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No watches yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Get started by adding your first watch to track your inventory and
              profits.
            </p>
            <Link
              href="/inventory/new"
              className="inline-flex items-center px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
            >
              Add Watch
            </Link>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <SortableHeader
                label="Brand"
                field="brand"
                currentSort={sort}
                currentOrder={order}
                onSort={handleSort}
              />
              <SortableHeader
                label="Model"
                field="model"
                currentSort={sort}
                currentOrder={order}
                onSort={handleSort}
              />
              <th className="text-left p-4 text-gray-700 dark:text-gray-300 font-semibold text-sm">
                Reference
              </th>
              <th className="text-left p-4 text-gray-700 dark:text-gray-300 font-semibold text-sm">
                Source
              </th>
              <SortableHeader
                label="Status"
                field="status"
                currentSort={sort}
                currentOrder={order}
                onSort={handleSort}
              />
              <SortableHeader
                label="Cost"
                field="purchasePrice"
                currentSort={sort}
                currentOrder={order}
                onSort={handleSort}
                align="right"
              />
              <th className="text-right p-4 text-gray-700 dark:text-gray-300 font-semibold text-sm">
                Profit
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
              const profit = watch.salePrice
                ? salePrice - totalSaleCosts - totalCost
                : null;

              return (
                <tr
                  key={watch.id}
                  className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="p-4 text-gray-900 dark:text-white">
                    <Link
                      href={`/inventory/${watch.id}`}
                      className="text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 hover:underline font-medium"
                    >
                      {watch.brand}
                    </Link>
                  </td>
                  <td className="p-4 text-gray-900 dark:text-white">
                    {watch.model}
                  </td>
                  <td className="p-4 text-gray-600 dark:text-gray-400">
                    {watch.reference || "—"}
                  </td>
                  <td className="p-4 text-gray-600 dark:text-gray-400">
                    {watch.purchaseSource || "—"}
                  </td>
                  <td className="p-4">
                    <StatusBadge status={watch.status} />
                  </td>
                  <td className="p-4 text-right text-gray-900 dark:text-white tabular-nums">
                    $
                    {totalCost.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="p-4 text-right tabular-nums">
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
                      <span className="text-gray-400 dark:text-gray-500">
                        —
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SortableHeader({
  label,
  field,
  currentSort,
  currentOrder,
  onSort,
  align = "left",
}: {
  label: string;
  field: string;
  currentSort: string;
  currentOrder: string;
  onSort: (field: string) => void;
  align?: "left" | "right";
}) {
  const isActive = currentSort === field;

  return (
    <th
      className={`p-4 text-gray-700 dark:text-gray-300 font-semibold text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors select-none ${
        align === "right" ? "text-right" : "text-left"
      }`}
      onClick={() => onSort(field)}
    >
      <div
        className={`flex items-center gap-1 ${
          align === "right" ? "justify-end" : ""
        }`}
      >
        {label}
        <span className="flex flex-col">
          <ChevronUp
            size={12}
            className={
              isActive && currentOrder === "asc"
                ? "text-gray-900 dark:text-white"
                : "text-gray-300 dark:text-gray-600"
            }
          />
          <ChevronDown
            size={12}
            className={`-mt-1 ${
              isActive && currentOrder === "desc"
                ? "text-gray-900 dark:text-white"
                : "text-gray-300 dark:text-gray-600"
            }`}
          />
        </span>
      </div>
    </th>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    in_stock:
      "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400",
    sold: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400",
    traded:
      "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400",
    consigned:
      "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400",
  };

  return (
    <span
      className={`px-2 py-1 rounded text-xs font-medium ${
        styles[status] || "bg-gray-100 dark:bg-gray-700"
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
}
