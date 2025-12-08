"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronUp, ChevronDown, Package } from "lucide-react";

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
};

export default function InventoryTable({ watches, sort, order }: Props) {
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
      <div className="bg-white border rounded-lg p-12 text-center">
        <Package className="mx-auto text-gray-300 mb-4" size={48} />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No watches found
        </h3>
        <p className="text-gray-500 mb-6">
          Get started by adding your first watch to the inventory.
        </p>
        <Link
          href="/inventory/new"
          className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          Add Watch
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
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
              <th className="text-left p-4 text-gray-700 font-semibold text-sm">
                Reference
              </th>
              <th className="text-left p-4 text-gray-700 font-semibold text-sm">
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
              <th className="text-right p-4 text-gray-700 font-semibold text-sm">
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
                  className="border-b hover:bg-gray-50 transition-colors"
                >
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
                  <td className="p-4 text-right text-gray-900 tabular-nums">
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
                      <span className="text-gray-400">—</span>
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
      className={`p-4 text-gray-700 font-semibold text-sm cursor-pointer hover:bg-gray-100 transition-colors select-none ${
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
                ? "text-black"
                : "text-gray-300"
            }
          />
          <ChevronDown
            size={12}
            className={`-mt-1 ${
              isActive && currentOrder === "desc"
                ? "text-black"
                : "text-gray-300"
            }`}
          />
        </span>
      </div>
    </th>
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
      className={`px-2 py-1 rounded text-xs font-medium ${
        styles[status] || "bg-gray-100"
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
}
