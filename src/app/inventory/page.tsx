import Link from "next/link";
import { prisma } from "../../../lib/prisma";

export default async function InventoryPage() {
  const watches = await prisma.watch.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="max-w-6xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Inventory</h1>
        <Link
          href="/inventory/new"
          className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
        >
          Add Watch
        </Link>
      </div>

      {watches.length === 0 ? (
        <p className="text-gray-500">No watches in inventory yet.</p>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-4">Brand</th>
                <th className="text-left p-4">Model</th>
                <th className="text-left p-4">Reference</th>
                <th className="text-left p-4">Status</th>
                <th className="text-right p-4">Purchase Price</th>
              </tr>
            </thead>
            <tbody>
              {watches.map((watch) => (
                <tr key={watch.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">{watch.brand}</td>
                  <td className="p-4">{watch.model}</td>
                  <td className="p-4 text-gray-500">
                    {watch.reference || "—"}
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                      {watch.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {watch.purchasePrice
                      ? `$${watch.purchasePrice.toLocaleString()}`
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
