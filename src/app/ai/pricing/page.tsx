"use client";

import { useState } from "react";

export default function PricingAssistantPage() {
  const [description, setDescription] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;

    setLoading(true);
    setAnalysis("");

    try {
      const res = await fetch("/api/ai/pricing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });

      const data = await res.json();

      if (data.error) {
        setAnalysis(`Error: ${data.error}`);
      } else {
        setAnalysis(data.analysis);
      }
    } catch (error) {
      setAnalysis("Failed to get analysis. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-2">Pricing Assistant</h1>
      <p className="text-gray-600 mb-8">
        Describe a watch you&apos;re considering and get pricing guidance based
        on your sales history.
      </p>

      <form onSubmit={handleAnalyze} className="mb-8">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Describe the watch you&apos;re considering
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Example: Breguet Classique 5140 in yellow gold, circa 2005, with box and papers. Asking price is $12,000 from a dealer on Chrono24. Watch appears to be in excellent condition with minor wear."
            rows={6}
            className="w-full border rounded-lg px-4 py-3 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !description.trim()}
          className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Analyze Purchase"}
        </button>
      </form>

      {analysis && (
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Analysis</h2>
          <div className="prose prose-sm max-w-none">
            {analysis.split("\n").map((line, i) => (
              <p
                key={i}
                className={
                  line.startsWith("**") ? "font-semibold mt-4" : "text-gray-700"
                }
              >
                {line.replace(/\*\*/g, "")}
              </p>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
