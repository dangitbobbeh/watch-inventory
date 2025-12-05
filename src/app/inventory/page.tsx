import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function InventoryPage() {
  const watches = await prisma.watch.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="max-w-6xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Inventory</h1>
      </div>

      {watches.length === 0 ? (
        <p className="text-gray-500">No watches in inventory yet.</p>
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
                  Status
                </th>
                <th className="text-right p-4 text-gray-900 font-semibold">
                  Purchase Price
                </th>
              </tr>
            </thead>
            <tbody>
              {watches.map((watch) => (
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
                  <td className="p-4">
                    <StatusBadge status={watch.status} />
                  </td>
                  <td className="p-4 text-right text-gray-900">
                    {watch.purchasePrice
                      ? `$${Number(watch.purchasePrice).toLocaleString()}`
                      : "—"}
                  </td>
                </tr>
              ))}
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
