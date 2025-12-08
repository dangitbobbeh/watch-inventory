"use client";

import { useState } from "react";
import Papa from "papaparse";
import { toast } from "sonner";
import { Loader2, Upload, CheckCircle } from "lucide-react";

export default function ImportPage() {
  const [inventoryFile, setInventoryFile] = useState<File | null>(null);
  const [salesFile, setSalesFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    success: number;
    errors: string[];
  } | null>(null);

  async function handleImport() {
    if (!inventoryFile) {
      toast.error("Please select an inventory CSV file");
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

      if (allErrors.length === 0) {
        toast.success(`Successfully imported ${totalSuccess} records!`);
      } else {
        toast.info(
          `Imported ${totalSuccess} records with ${allErrors.length} errors`
        );
      }
    } catch (error) {
      toast.error((error as Error).message);
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
          <label className="block">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setInventoryFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                inventoryFile
                  ? "border-green-300 bg-green-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              {inventoryFile ? (
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <CheckCircle size={20} />
                  <span className="font-medium">{inventoryFile.name}</span>
                </div>
              ) : (
                <div className="text-gray-500">
                  <Upload className="mx-auto mb-2" size={24} />
                  <span>Click to upload inventory CSV</span>
                </div>
              )}
            </div>
          </label>
        </section>

        <section className="bg-white border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">
            Step 2: Sales CSV (Optional)
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            Export your sales sheet as CSV. This will update inventory items
            with sale data using the Watch ID to match records.
          </p>
          <label className="block">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setSalesFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                salesFile
                  ? "border-green-300 bg-green-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              {salesFile ? (
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <CheckCircle size={20} />
                  <span className="font-medium">{salesFile.name}</span>
                </div>
              ) : (
                <div className="text-gray-500">
                  <Upload className="mx-auto mb-2" size={24} />
                  <span>Click to upload sales CSV</span>
                </div>
              )}
            </div>
          </label>
        </section>

        <button
          onClick={handleImport}
          disabled={!inventoryFile || importing}
          className="w-full bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
        >
          {importing && <Loader2 className="animate-spin" size={20} />}
          {importing ? "Importing..." : "Import Data"}
        </button>

        {result && (
          <section className="bg-white border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Import Results</h2>
            <p className="text-green-600 font-medium flex items-center gap-2">
              <CheckCircle size={20} />
              {result.success} records imported successfully
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
