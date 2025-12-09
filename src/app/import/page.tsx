"use client";

import { useState } from "react";
import Papa from "papaparse";
import { toast } from "sonner";
import {
  Loader2,
  Upload,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from "lucide-react";

type FieldDef = {
  key: string;
  label: string;
  required: boolean;
};

type ImportStep = "upload" | "mapping" | "result";

export default function ImportPage() {
  const [step, setStep] = useState<ImportStep>("upload");
  const [importType, setImportType] = useState<"inventory" | "sales">(
    "inventory"
  );
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

      // Call AI to analyze the mapping
      const res = await fetch("/api/import/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headers,
          sampleRows: rows.slice(0, 5),
          type: importType,
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
      // Transform rows using the mapping
      const transformedRows = allRows.map((row) => {
        const transformed: Record<string, string> = {};
        Object.entries(mapping).forEach(([header, fieldKey]) => {
          if (fieldKey && row[header]) {
            transformed[fieldKey] = row[header];
          }
        });
        return transformed;
      });

      const endpoint =
        importType === "sales"
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
        toast.success(`Successfully imported ${data.success} records!`);
      } else {
        toast.info(
          `Imported ${data.success} records with ${data.errors.length} errors`
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
    setStep("upload");
    setFile(null);
    setHeaders([]);
    setSampleRows([]);
    setAllRows([]);
    setMapping({});
    setFields([]);
    setResult(null);
  }

  // Check if required fields are mapped
  const requiredFields = fields.filter((f) => f.required);
  const mappedFields = Object.values(mapping).filter(Boolean);
  const missingRequired = requiredFields.filter(
    (f) => !mappedFields.includes(f.key)
  );

  return (
    <main className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
        Import Data
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Upload your CSV and we&apos;ll help map the columns to the right fields.
      </p>

      {/* Progress Steps */}
      <div className="flex items-center gap-4 mb-8">
        <StepIndicator
          step={1}
          label="Upload"
          active={step === "upload"}
          completed={step !== "upload"}
        />
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        <StepIndicator
          step={2}
          label="Map Fields"
          active={step === "mapping"}
          completed={step === "result"}
        />
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        <StepIndicator
          step={3}
          label="Complete"
          active={step === "result"}
          completed={false}
        />
      </div>

      {/* Step 1: Upload */}
      {step === "upload" && (
        <div className="space-y-6">
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setImportType("inventory")}
              className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                importType === "inventory"
                  ? "border-black dark:border-white bg-gray-50 dark:bg-gray-800"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Inventory
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Import watch inventory data
              </p>
            </button>
            <button
              onClick={() => setImportType("sales")}
              className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                importType === "sales"
                  ? "border-black dark:border-white bg-gray-50 dark:bg-gray-800"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Sales
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Update inventory with sale data
              </p>
            </button>
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

      {/* Step 2: Mapping */}
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
                We&apos;ve analyzed your CSV and suggested field mappings.
                Review and adjust as needed.
              </p>
            </div>
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
                Map each CSV column to a field
              </p>
            </div>
            <div className="p-4 space-y-3">
              {headers.map((header) => (
                <div key={header} className="flex items-center gap-4">
                  <div className="w-1/3">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                      {header}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      e.g., {sampleRows[0]?.[header] || "—"}
                    </p>
                  </div>
                  <ArrowRight className="text-gray-400" size={16} />
                  <select
                    value={mapping[header] || ""}
                    onChange={(e) =>
                      updateMapping(header, e.target.value || null)
                    }
                    className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  >
                    <option value="">— Skip this column —</option>
                    {fields.map((field) => (
                      <option key={field.key} value={field.key}>
                        {field.label} {field.required ? "*" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
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

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={resetImport}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
            >
              <ArrowLeft className="inline mr-2" size={16} />
              Back
            </button>
            <button
              onClick={handleImport}
              disabled={importing || missingRequired.length > 0}
              className="flex-1 bg-black dark:bg-white text-white dark:text-black px-6 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
            >
              {importing && <Loader2 className="animate-spin" size={16} />}
              {importing ? "Importing..." : `Import ${allRows.length} Records`}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Result */}
      {step === "result" && result && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
            <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Import Complete!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Successfully imported {result.success} records
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
            <a
              href="/inventory"
              className="flex-1 bg-black dark:bg-white text-white dark:text-black px-6 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 text-center transition-colors"
            >
              View Inventory
            </a>
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
        className={`text-sm font-medium ${
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
