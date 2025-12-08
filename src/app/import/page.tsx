"use client";

import { useState } from "react";
import Papa from "papaparse";

type ImportResult = {
  success: number;
  errors: string[];
};

export default function ImportPage() {
  const [inventoryFile, setInventoryFile] = useState<File | null>(null);
  const [salesFile, setSalesFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function handleImport() {
    if (!inventoryFile) {
      alert("Please select an inventory CSV file");
      return;
    }

    setImporting(true);
    setResult(null);

    try {
      const inventoryData = await parseCSV(inventoryFile);
      const inventoryResult = await fetch("/api/import/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: inventoryData }),
      });

      if (!inventoryResult.ok) {
        throw new Error("Failed to import inventory");
      }

      const invResponse = await inventoryResult.json();
      let totalSuccess = invResponse.success;
      let allErrors = [...invResponse.errors];

      if (salesFile) {
        const salesData = await parseCSV(salesFile);
        const salesResult = await fetch("/api/import/sales", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows: salesData }),
        });

        if (!salesResult.ok) {
          throw new Error("Failed to import sales");
        }

        const salesResponse = await salesResult.json();
        totalSuccess += salesResponse.success;
        allErrors = [...allErrors, ...salesResponse.errors];
      }

      setResult({ success: totalSuccess, errors: allErrors });
    } catch (error) {
      setResult({ success: 0, errors: [(error as Error).message] });
    } finally {
      setImporting(false);
    }
  }

  function parseCSV(file: File): Promise<Record<string, string>[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) =>
          resolve(results.data as Record<string, string>[]),
        error: (error) => reject(error),
      });
    });
  }

  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Import Data</h1>

      <div className="space-y-6">
        <section className="bg-white border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Step 1: Inventory CSV</h2>
          <p className="text-gray-600 text-sm mb-4">
            Export your inventory sheet as CSV and upload it here.
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setInventoryFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800"
          />
          {inventoryFile && (
            <p className="mt-2 text-sm text-green-600">
              ✓ {inventoryFile.name}
            </p>
          )}
        </section>

        <section className="bg-white border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">
            Step 2: Sales CSV (Optional)
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            Export your sales sheet as CSV. This will update inventory items
            with sale data using the Watch ID to match records.
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setSalesFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800"
          />
          {salesFile && (
            <p className="mt-2 text-sm text-green-600">✓ {salesFile.name}</p>
          )}
        </section>

        <button
          onClick={handleImport}
          disabled={!inventoryFile || importing}
          className="w-full bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 disabled:opacity-50"
        >
          {importing ? "Importing..." : "Import Data"}
        </button>

        {result && (
          <section className="bg-white border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Import Results</h2>
            <p className="text-green-600 font-medium">
              ✓ {result.success} records imported successfully
            </p>
            {result.errors.length > 0 && (
              <div className="mt-4">
                <p className="text-red-600 font-medium mb-2">
                  {result.errors.length} errors:
                </p>
                <ul className="text-sm text-red-600 space-y-1 max-h-40 overflow-y-auto">
                  {result.errors.map((error, i) => (
                    <li key={i}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
