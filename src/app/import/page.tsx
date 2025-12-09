"use client";

import { useState } from "react";
import Link from "next/link";
import Papa from "papaparse";
import { toast } from "sonner";
import {
  Loader2,
  Upload,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Database,
  Info,
  Plus,
  RefreshCw,
} from "lucide-react";

type FieldDef = {
  key: string;
  label: string;
  required: boolean;
};

type ImportStep = "select-mode" | "upload" | "mapping" | "result";
type ImportMode = "new" | "update";

export default function ImportPage() {
  const [step, setStep] = useState<ImportStep>("select-mode");
  const [mode, setMode] = useState<ImportMode>("new");
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [sampleRows, setSampleRows] = useState<Record<string, string>[]>([]);
  const [allRows, setAllRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string | null>>({});
  const [fields, setFields] = useState<FieldDef[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    success: number;
    errors: string[];
  } | null>(null);

  function parseCSV(
    file: File
  ): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const rows = results.data as Record<string, string>[];
          const headers = results.meta.fields || [];
          resolve({ headers, rows });
        },
        error: (error) => reject(error),
      });
    });
  }

  async function handleFileSelect(selectedFile: File) {
    setFile(selectedFile);
    setAnalyzing(true);

    try {
      const { headers, rows } = await parseCSV(selectedFile);
      setHeaders(headers);
      setAllRows(rows);
      setSampleRows(rows.slice(0, 3));

      const res = await fetch("/api/import/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headers,
          sampleRows: rows.slice(0, 5),
          mode,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to analyze CSV");
      }

      const data = await res.json();
      setMapping(data.mapping);
      setFields(data.fields);
      setStep("mapping");
    } catch (error) {
      toast.error("Failed to analyze CSV file");
      console.error(error);
    } finally {
      setAnalyzing(false);
    }
  }

  function updateMapping(header: string, fieldKey: string | null) {
    setMapping((prev) => ({ ...prev, [header]: fieldKey }));
  }

  async function handleImport() {
    setImporting(true);

    try {
      const transformedRows = allRows.map((row) => {
        const transformed: Record<string, string> = {};
        const customData: Record<string, string> = {};

        Object.entries(mapping).forEach(([header, fieldKey]) => {
          if (fieldKey && row[header]) {
            if (fieldKey === "custom") {
              customData[header] = row[header];
            } else {
              transformed[fieldKey] = row[header];
            }
          }
        });

        if (Object.keys(customData).length > 0) {
          transformed._customData = JSON.stringify(customData);
        }

        return transformed;
      });

      const endpoint =
        mode === "update"
          ? "/api/import/sales-mapped"
          : "/api/import/inventory-mapped";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: transformedRows }),
      });

      if (!res.ok) {
        throw new Error("Import failed");
      }

      const data = await res.json();
      setResult(data);
      setStep("result");

      if (data.errors.length === 0) {
        toast.success(
          `Successfully ${mode === "update" ? "updated" : "imported"} ${
            data.success
          } records!`
        );
      } else {
        toast.info(
          `${mode === "update" ? "Updated" : "Imported"} ${
            data.success
          } records with ${data.errors.length} errors`
        );
      }
    } catch (error) {
      toast.error("Import failed");
      console.error(error);
    } finally {
      setImporting(false);
    }
  }

  function resetImport() {
    setStep("select-mode");
    setFile(null);
    setHeaders([]);
    setSampleRows([]);
    setAllRows([]);
    setMapping({});
    setFields([]);
    setResult(null);
  }

  function selectMode(selectedMode: ImportMode) {
    setMode(selectedMode);
    setStep("upload");
  }

  const requiredFields = fields.filter((f) => f.required);
  const mappedFields = Object.values(mapping).filter(Boolean);
  const missingRequired = requiredFields.filter(
    (f) => !mappedFields.includes(f.key)
  );
  const customFieldCount = Object.values(mapping).filter(
    (v) => v === "custom"
  ).length;
  const skippedFieldCount = Object.values(mapping).filter(
    (v) => v === null
  ).length;

  const hasSaleData =
    mappedFields.includes("salePrice") || mappedFields.includes("saleDate");
  const hasStatusField = mappedFields.includes("status");
  const hasAskingPrice = mappedFields.includes("askingPrice");

  return (
    <main className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
        Import Data
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Upload your CSV and we&apos;ll intelligently map columns to the right
        fields.
      </p>

      {/* Progress Steps */}
      <div className="flex items-center gap-4 mb-8">
        <StepIndicator
          step={1}
          label="Select Type"
          active={step === "select-mode"}
          completed={step !== "select-mode"}
        />
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        <StepIndicator
          step={2}
          label="Upload"
          active={step === "upload"}
          completed={step === "mapping" || step === "result"}
        />
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        <StepIndicator
          step={3}
          label="Map Fields"
          active={step === "mapping"}
          completed={step === "result"}
        />
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        <StepIndicator
          step={4}
          label="Complete"
          active={step === "result"}
          completed={false}
        />
      </div>

      {/* Step 1: Select Mode */}
      {step === "select-mode" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => selectMode("new")}
              className="p-6 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-black dark:hover:border-white transition-colors text-left group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform">
                  <Plus size={24} />
                </div>
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                  New Inventory
                </h3>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Import new watches into your inventory. Can include purchase
                info, sale info, status, and any custom fields.
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <li>• Creates new watch records</li>
                <li>• Handles inventory + sales in one file</li>
                <li>• Auto-detects sold vs in-stock</li>
              </ul>
            </button>

            <button
              onClick={() => selectMode("update")}
              className="p-6 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-black dark:hover:border-white transition-colors text-left group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                  <RefreshCw size={24} />
                </div>
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                  Update Sales
                </h3>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Add sale information to watches already in your inventory.
                Matches by Watch ID.
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <li>• Updates existing records</li>
                <li>• Requires Watch ID to match</li>
                <li>• Adds sale price, date, fees, etc.</li>
              </ul>
            </button>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong className="text-gray-900 dark:text-white">
                Not sure which to choose?
              </strong>{" "}
              If your CSV has brand and model columns, use &quot;New
              Inventory&quot;. If it&apos;s just sale data for watches
              you&apos;ve already imported, use &quot;Update Sales&quot;.
            </p>
          </div>
        </div>
      )}

      {/* Step 2: Upload */}
      {step === "upload" && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setStep("select-mode")}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ← Back
            </button>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {mode === "new" ? "New Inventory Import" : "Sales Update Import"}
            </span>
          </div>

          <div
            className={`border rounded-lg p-4 flex items-start gap-3 ${
              mode === "new"
                ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
            }`}
          >
            <Info
              className={`mt-0.5 flex-shrink-0 ${
                mode === "new"
                  ? "text-green-600 dark:text-green-400"
                  : "text-blue-600 dark:text-blue-400"
              }`}
              size={20}
            />
            <div
              className={`text-sm ${
                mode === "new"
                  ? "text-green-700 dark:text-green-300"
                  : "text-blue-700 dark:text-blue-300"
              }`}
            >
              {mode === "new" ? (
                <>
                  <p className="font-medium text-green-900 dark:text-green-100 mb-1">
                    Creating new watch records
                  </p>
                  <p>
                    Your CSV should include at minimum Brand and Model. It can
                    also include purchase info, sale info, status, asking
                    prices, and any custom fields you want to track.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                    Updating existing watches
                  </p>
                  <p>
                    Your CSV must include a Watch ID column that matches the ID
                    from your original import. We&apos;ll update those records
                    with the sale information.
                  </p>
                </>
              )}
            </div>
          </div>

          <label className="block">
            <input
              type="file"
              accept=".csv"
              onChange={(e) =>
                e.target.files?.[0] && handleFileSelect(e.target.files[0])
              }
              className="hidden"
              disabled={analyzing}
            />
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                analyzing
                  ? "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                  : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
              }`}
            >
              {analyzing ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="animate-spin text-gray-400" size={32} />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Analyzing your CSV...
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Using AI to detect column mappings
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 dark:text-gray-400">
                  <Upload className="mx-auto mb-3" size={32} />
                  <p className="font-medium text-gray-700 dark:text-gray-300">
                    Click to upload CSV
                  </p>
                  <p className="text-sm mt-1">or drag and drop</p>
                </div>
              )}
            </div>
          </label>
        </div>
      )}

      {/* Step 3: Mapping */}
      {step === "mapping" && (
        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-start gap-3">
            <Sparkles
              className="text-blue-600 dark:text-blue-400 mt-0.5"
              size={20}
            />
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">
                AI-detected mappings
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Review the suggested mappings below. Adjust as needed before{" "}
                {mode === "update" ? "updating" : "importing"}.
              </p>
            </div>
          </div>

          {/* Data Detection Info */}
          <div className="flex flex-wrap gap-2">
            <span
              className={`px-3 py-1 rounded-full text-sm ${
                mode === "new"
                  ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                  : "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
              }`}
            >
              {mode === "new" ? "+ New records" : "↻ Updating records"}
            </span>
            {hasSaleData && (
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm">
                ✓ Sales data detected
              </span>
            )}
            {hasStatusField && (
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm">
                ✓ Status column detected
              </span>
            )}
            {hasAskingPrice && (
              <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-sm">
                ✓ Asking price detected
              </span>
            )}
          </div>

          {/* Sample Data Preview */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Sample Data Preview
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                First 3 rows from your CSV
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    {headers.map((header) => (
                      <th
                        key={header}
                        className="p-3 text-left text-gray-700 dark:text-gray-300 font-medium whitespace-nowrap"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sampleRows.map((row, i) => (
                    <tr
                      key={i}
                      className="border-t border-gray-100 dark:border-gray-700"
                    >
                      {headers.map((header) => (
                        <td
                          key={header}
                          className="p-3 text-gray-600 dark:text-gray-400 whitespace-nowrap max-w-[200px] truncate"
                        >
                          {row[header] || "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Field Mappings */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Column Mappings
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Map each CSV column to a field, store as custom data, or skip
              </p>
            </div>
            <div className="p-4 space-y-3">
              {headers.map((header) => {
                const currentMapping = mapping[header];
                const isCustom = currentMapping === "custom";
                const isSkipped = currentMapping === null;
                const isRequired =
                  currentMapping === "importId" && mode === "update";

                return (
                  <div
                    key={header}
                    className={`flex items-center gap-4 p-3 rounded-lg ${
                      isCustom
                        ? "bg-purple-50 dark:bg-purple-900/20"
                        : isSkipped
                        ? "bg-gray-50 dark:bg-gray-900/50 opacity-60"
                        : isRequired
                        ? "bg-yellow-50 dark:bg-yellow-900/20"
                        : ""
                    }`}
                  >
                    <div className="w-1/3">
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        {header}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        e.g., {sampleRows[0]?.[header] || "—"}
                      </p>
                    </div>
                    <ArrowRight
                      className="text-gray-400 flex-shrink-0"
                      size={16}
                    />
                    <select
                      value={mapping[header] || ""}
                      onChange={(e) =>
                        updateMapping(header, e.target.value || null)
                      }
                      className={`flex-1 border rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white ${
                        isCustom
                          ? "border-purple-300 dark:border-purple-700"
                          : isRequired
                          ? "border-yellow-300 dark:border-yellow-700"
                          : "border-gray-200 dark:border-gray-700"
                      }`}
                    >
                      <option value="">— Skip this column —</option>

                      {mode === "update" ? (
                        <>
                          <optgroup label="Required">
                            <option value="importId">
                              Watch ID (for matching) *
                            </option>
                          </optgroup>
                          <optgroup label="Sale Info">
                            {fields
                              .filter((f) =>
                                [
                                  "saleDate",
                                  "salePrice",
                                  "salePlatform",
                                  "platformFees",
                                  "salesTax",
                                  "marketingCosts",
                                  "shippingCosts",
                                ].includes(f.key)
                              )
                              .map((field) => (
                                <option key={field.key} value={field.key}>
                                  {field.label}
                                </option>
                              ))}
                          </optgroup>
                          <optgroup label="Other">
                            <option value="status">Status</option>
                            <option value="notes">Notes</option>
                            <option value="custom">
                              📦 Store as Custom Field
                            </option>
                          </optgroup>
                        </>
                      ) : (
                        <>
                          <optgroup label="Watch Details">
                            {fields
                              .filter((f) =>
                                [
                                  "brand",
                                  "model",
                                  "reference",
                                  "serial",
                                  "year",
                                  "caseMaterial",
                                  "dialColor",
                                  "diameter",
                                  "condition",
                                  "accessories",
                                  "importId",
                                ].includes(f.key)
                              )
                              .map((field) => (
                                <option key={field.key} value={field.key}>
                                  {field.label} {field.required ? "*" : ""}
                                </option>
                              ))}
                          </optgroup>
                          <optgroup label="Purchase Info">
                            {fields
                              .filter((f) =>
                                [
                                  "purchaseDate",
                                  "purchaseSource",
                                  "purchasePrice",
                                  "purchaseShippingCost",
                                  "additionalCosts",
                                ].includes(f.key)
                              )
                              .map((field) => (
                                <option key={field.key} value={field.key}>
                                  {field.label}
                                </option>
                              ))}
                          </optgroup>
                          <optgroup label="Sale Info">
                            {fields
                              .filter((f) =>
                                [
                                  "saleDate",
                                  "salePrice",
                                  "salePlatform",
                                  "platformFees",
                                  "salesTax",
                                  "marketingCosts",
                                  "shippingCosts",
                                ].includes(f.key)
                              )
                              .map((field) => (
                                <option key={field.key} value={field.key}>
                                  {field.label}
                                </option>
                              ))}
                          </optgroup>
                          <optgroup label="Other">
                            <option value="status">Status</option>
                            <option value="askingPrice">
                              Asking Price (custom)
                            </option>
                            <option value="notes">Notes</option>
                            <option value="custom">
                              📦 Store as Custom Field
                            </option>
                          </optgroup>
                        </>
                      )}
                    </select>
                    {isCustom && (
                      <Database
                        size={16}
                        className="text-purple-500 flex-shrink-0"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary Stats */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span>
                {
                  Object.values(mapping).filter(
                    (v) => v && v !== "custom" && v !== "askingPrice"
                  ).length
                }{" "}
                standard fields
              </span>
            </div>
            {(customFieldCount > 0 || hasAskingPrice) && (
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                <div className="w-3 h-3 rounded bg-purple-500" />
                <span>
                  {customFieldCount + (hasAskingPrice ? 1 : 0)} custom fields
                </span>
              </div>
            )}
            {skippedFieldCount > 0 && (
              <div className="flex items-center gap-2 text-gray-400">
                <div className="w-3 h-3 rounded bg-gray-300 dark:bg-gray-600" />
                <span>{skippedFieldCount} skipped</span>
              </div>
            )}
          </div>

          {/* Missing Required Fields Warning */}
          {missingRequired.length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="font-medium text-yellow-900 dark:text-yellow-100">
                Missing required fields
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Please map these required fields:{" "}
                {missingRequired.map((f) => f.label).join(", ")}
              </p>
            </div>
          )}

          {/* Update mode: require importId */}
          {mode === "update" && !mappedFields.includes("importId") && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="font-medium text-red-900 dark:text-red-100">
                Watch ID required
              </p>
              <p className="text-sm text-red-700 dark:text-red-300">
                To update existing records, you must map a column to &quot;Watch
                ID&quot; so we can match your sales data to the correct watches.
              </p>
            </div>
          )}

          {/* Status Info */}
          {hasStatusField && mode === "new" && (
            <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <p className="font-medium text-gray-900 dark:text-white text-sm">
                Status values will be normalized:
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                &quot;for sale&quot;, &quot;available&quot;, &quot;listed&quot;
                →{" "}
                <span className="font-mono bg-green-100 dark:bg-green-900/30 px-1 rounded">
                  in_stock
                </span>{" "}
                • &quot;sold&quot;, &quot;completed&quot; →{" "}
                <span className="font-mono bg-blue-100 dark:bg-blue-900/30 px-1 rounded">
                  sold
                </span>{" "}
                • &quot;traded&quot; →{" "}
                <span className="font-mono bg-purple-100 dark:bg-purple-900/30 px-1 rounded">
                  traded
                </span>{" "}
                • &quot;consigned&quot; →{" "}
                <span className="font-mono bg-yellow-100 dark:bg-yellow-900/30 px-1 rounded">
                  consigned
                </span>
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={resetImport}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
            >
              <ArrowLeft className="inline mr-2" size={16} />
              Start Over
            </button>
            <button
              onClick={handleImport}
              disabled={
                importing ||
                missingRequired.length > 0 ||
                (mode === "update" && !mappedFields.includes("importId"))
              }
              className="flex-1 bg-black dark:bg-white text-white dark:text-black px-6 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
            >
              {importing && <Loader2 className="animate-spin" size={16} />}
              {importing
                ? mode === "update"
                  ? "Updating..."
                  : "Importing..."
                : mode === "update"
                ? `Update ${allRows.length} Records`
                : `Import ${allRows.length} Records`}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Result */}
      {step === "result" && result && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
            <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {mode === "update" ? "Update" : "Import"} Complete!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Successfully {mode === "update" ? "updated" : "imported"}{" "}
              {result.success} records
            </p>
          </div>

          {result.errors.length > 0 && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="font-semibold text-red-600 mb-3">
                {result.errors.length} Errors
              </h3>
              <ul className="text-sm text-red-600 space-y-1 max-h-40 overflow-y-auto">
                {result.errors.map((error, i) => (
                  <li key={i}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={resetImport}
              className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
            >
              Import More
            </button>
            <Link
              href="/inventory"
              className="flex-1 bg-black dark:bg-white text-white dark:text-black px-6 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 text-center transition-colors"
            >
              View Inventory
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}

function StepIndicator({
  step,
  label,
  active,
  completed,
}: {
  step: number;
  label: string;
  active: boolean;
  completed: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
          active
            ? "bg-black dark:bg-white text-white dark:text-black"
            : completed
            ? "bg-green-500 text-white"
            : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
        }`}
      >
        {completed ? "✓" : step}
      </div>
      <span
        className={`text-sm font-medium hidden sm:inline ${
          active
            ? "text-gray-900 dark:text-white"
            : "text-gray-500 dark:text-gray-400"
        }`}
      >
        {label}
      </span>
    </div>
  );
}
