"use client";

import { useState } from "react";

type Summary = {
  inStockCount: number;
  inventoryValue: number;
  avgDaysToSell: number;
  soldCount: number;
};

export default function InventoryAdvisorPage() {
  const [analysis, setAnalysis] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleAnalyze() {
    setLoading(true);
    setAnalysis("");
    setSummary(null);

    try {
      const res = await fetch("/api/ai/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (data.error) {
        setAnalysis(`Error: ${data.error}`);
      } else {
        setAnalysis(data.analysis);
        setSummary(data.summary);
      }
    } catch (error) {
      setAnalysis("Failed to get analysis. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-2">Inventory Advisor</h1>
      <p className="text-gray-600 mb-8">
        Get AI-powered insights on your current inventory, slow movers, and
        optimization opportunities.
      </p>

      <button
        onClick={handleAnalyze}
        disabled={loading}
        className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 disabled:opacity-50 mb-8"
      >
        {loading ? "Analyzing Inventory..." : "Analyze My Inventory"}
      </button>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border rounded-lg p-4">
            <p className="text-gray-500 text-sm">In Stock</p>
            <p className="text-xl font-semibold">{summary.inStockCount}</p>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <p className="text-gray-500 text-sm">Inventory Value</p>
            <p className="text-xl font-semibold">
              $
              {summary.inventoryValue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <p className="text-gray-500 text-sm">Avg Days to Sell</p>
            <p className="text-xl font-semibold">
              {summary.avgDaysToSell} days
            </p>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <p className="text-gray-500 text-sm">Total Sold</p>
            <p className="text-xl font-semibold">{summary.soldCount}</p>
          </div>
        </div>
      )}

      {analysis && (
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">
            Analysis & Recommendations
          </h2>
          <div className="prose prose-sm max-w-none">
            {analysis.split("\n").map((line, i) => {
              if (line.startsWith("**") && line.endsWith("**")) {
                return (
                  <h3
                    key={i}
                    className="text-base font-semibold mt-6 mb-2 text-gray-900"
                  >
                    {line.replace(/\*\*/g, "")}
                  </h3>
                );
              }
              if (line.startsWith("- ") || line.startsWith("• ")) {
                return (
                  <p key={i} className="text-gray-700 ml-4 my-1">
                    {line}
                  </p>
                );
              }
              if (line.trim()) {
                return (
                  <p key={i} className="text-gray-700 my-2">
                    {line.replace(/\*\*/g, "")}
                  </p>
                );
              }
              return null;
            })}
          </div>
        </div>
      )}
    </main>
  );
}
