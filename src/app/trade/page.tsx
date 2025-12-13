"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeftRight, ArrowRight, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";

type Watch = {
  id: string;
  brand: string;
  model: string;
  reference: string | null;
  serial: string | null;
  purchasePrice: number | null;
};

type Step = 1 | 2 | 3 | 4;

export default function TradePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [availableWatches, setAvailableWatches] = useState<Watch[]>([]);
  const [fetchingWatches, setFetchingWatches] = useState(true);

  const [selectedWatch, setSelectedWatch] = useState<Watch | null>(null);
  const [tradeValue, setTradeValue] = useState<string>("");
  const [cashDifference, setCashDifference] = useState<string>("0");
  const [cashDirection, setCashDirection] = useState<
    "received" | "paid" | "even"
  >("even");
  const [tradeCounterparty, setTradeCounterparty] = useState("");
  const [tradeDate, setTradeDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [incomingWatch, setIncomingWatch] = useState({
    brand: "",
    model: "",
    reference: "",
    serial: "",
    year: "",
    caseMaterial: "",
    dialColor: "",
    diameter: "",
    condition: "",
    accessories: "",
    notes: "",
  });

  const [tradeResult, setTradeResult] = useState<{
    outgoingWatch: Watch;
    incomingWatch: Watch;
    summary: {
      tradedAway: string;
      received: string;
      tradeValue: number;
      cashDifference: number;
      costBasis: number;
    };
  } | null>(null);

  useEffect(() => {
    async function fetchWatches() {
      try {
        const res = await fetch("/api/watches?status=in_stock");
        if (res.ok) {
          const data = await res.json();
          setAvailableWatches(
            data.map((w: Record<string, unknown>) => ({
              id: w.id,
              brand: w.brand,
              model: w.model,
              reference: w.reference,
              serial: w.serial,
              purchasePrice: w.purchasePrice ? Number(w.purchasePrice) : null,
            }))
          );
        }
      } catch (error) {
        console.error("Failed to fetch watches:", error);
        toast.error("Failed to load watches");
      } finally {
        setFetchingWatches(false);
      }
    }
    fetchWatches();
  }, []);

  const actualCashDifference =
    cashDirection === "even"
      ? 0
      : cashDirection === "received"
      ? parseFloat(cashDifference) || 0
      : -(parseFloat(cashDifference) || 0);

  const incomingCostBasis =
    (parseFloat(tradeValue) || 0) - actualCashDifference;

  const handleSubmitTrade = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outgoingWatchId: selectedWatch?.id,
          tradeValue: parseFloat(tradeValue),
          cashDifference: actualCashDifference,
          tradeCounterparty,
          tradeDate,
          incomingWatch,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setTradeResult(data);
        setStep(4);
        toast.success("Trade completed successfully!");
      } else {
        toast.error(data.error || "Failed to process trade");
      }
    } catch (error) {
      console.error("Trade error:", error);
      toast.error("Failed to process trade");
    } finally {
      setLoading(false);
    }
  };

  const canProceedToStep2 = selectedWatch !== null;
  const canProceedToStep3 =
    tradeValue && parseFloat(tradeValue) > 0 && tradeDate;
  const canSubmit = incomingWatch.brand && incomingWatch.model;

  return (
    <main className="max-w-4xl mx-auto p-8">
      <div className="mb-8">
        <Link
          href="/inventory"
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm mb-4 inline-block"
        >
          ← Back to Inventory
        </Link>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <ArrowLeftRight className="text-blue-600" />
          Record a Trade
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Trade one of your watches for another
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8 max-w-2xl">
        {[
          { num: 1, label: "Select Watch" },
          { num: 2, label: "Trade Value" },
          { num: 3, label: "Incoming Watch" },
          { num: 4, label: "Complete" },
        ].map(({ num, label }, i) => (
          <div key={num} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step >= num
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
              }`}
            >
              {step > num ? <Check size={16} /> : num}
            </div>
            <span
              className={`ml-2 text-sm hidden sm:inline ${
                step >= num
                  ? "text-gray-900 dark:text-white"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {label}
            </span>
            {i < 3 && (
              <div
                className={`w-12 h-0.5 mx-2 ${
                  step > num ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Select Watch */}
      {step === 1 && (
        <div className="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">
            Which watch are you trading away?
          </h2>

          {fetchingWatches ? (
            <p className="text-gray-500">Loading watches...</p>
          ) : availableWatches.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600 dark:text-gray-400">
                No watches available to trade
              </p>
              <Link
                href="/inventory/new"
                className="text-blue-600 hover:underline mt-2 inline-block"
              >
                Add a watch first
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {availableWatches.map((watch) => (
                <button
                  key={watch.id}
                  onClick={() => setSelectedWatch(watch)}
                  className={`w-full text-left p-4 rounded-lg border transition-colors ${
                    selectedWatch?.id === watch.id
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <div className="font-medium">
                    {watch.brand} {watch.model}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {watch.reference && `Ref. ${watch.reference}`}
                    {watch.reference && watch.serial && " · "}
                    {watch.serial && `S/N ${watch.serial}`}
                    {(watch.reference || watch.serial) &&
                      watch.purchasePrice &&
                      " · "}
                    {watch.purchasePrice &&
                      `Cost: $${watch.purchasePrice.toLocaleString()}`}
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="flex justify-end mt-6">
            <button
              onClick={() => setStep(2)}
              disabled={!canProceedToStep2}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Trade Value */}
      {step === 2 && (
        <div className="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Trade Details</h2>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Trading away:
            </p>
            <p className="font-medium">
              {selectedWatch?.brand} {selectedWatch?.model}
            </p>
            {selectedWatch?.purchasePrice && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Your cost: ${selectedWatch.purchasePrice.toLocaleString()}
              </p>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Trade Value *
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                What value are you assigning to your watch in this trade?
              </p>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  value={tradeValue}
                  onChange={(e) => setTradeValue(e.target.value)}
                  placeholder="0.00"
                  className="w-full border dark:border-gray-700 dark:bg-gray-800 rounded-lg pl-7 pr-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Cash Difference
              </label>
              <div className="flex gap-2 mb-2">
                {[
                  { value: "even", label: "Even trade" },
                  { value: "received", label: "I received cash" },
                  { value: "paid", label: "I paid cash" },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() =>
                      setCashDirection(value as "even" | "received" | "paid")
                    }
                    className={`px-3 py-1 rounded-lg text-sm ${
                      cashDirection === value
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {cashDirection !== "even" && (
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={cashDifference}
                    onChange={(e) => setCashDifference(e.target.value)}
                    placeholder="0.00"
                    className="w-full border dark:border-gray-700 dark:bg-gray-800 rounded-lg pl-7 pr-3 py-2"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Trade Date *
              </label>
              <input
                type="date"
                value={tradeDate}
                onChange={(e) => setTradeDate(e.target.value)}
                className="w-full border dark:border-gray-700 dark:bg-gray-800 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Trade Counterparty
              </label>
              <input
                type="text"
                value={tradeCounterparty}
                onChange={(e) => setTradeCounterparty(e.target.value)}
                placeholder="Dealer name, private party, etc."
                className="w-full border dark:border-gray-700 dark:bg-gray-800 rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-2 rounded-lg border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!canProceedToStep3}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Incoming Watch */}
      {step === 3 && (
        <div className="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">
            What watch are you receiving?
          </h2>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Cost basis for incoming watch:</strong> $
              {incomingCostBasis.toLocaleString()}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
              Trade value (${parseFloat(tradeValue).toLocaleString()})
              {actualCashDifference !== 0 && (
                <>
                  {actualCashDifference > 0 ? " - " : " + "}$
                  {Math.abs(actualCashDifference).toLocaleString()}{" "}
                  {actualCashDifference > 0 ? "received" : "paid"}
                </>
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Brand *</label>
              <input
                type="text"
                value={incomingWatch.brand}
                onChange={(e) =>
                  setIncomingWatch({ ...incomingWatch, brand: e.target.value })
                }
                placeholder="Rolex, Omega, etc."
                className="w-full border dark:border-gray-700 dark:bg-gray-800 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Model *</label>
              <input
                type="text"
                value={incomingWatch.model}
                onChange={(e) =>
                  setIncomingWatch({ ...incomingWatch, model: e.target.value })
                }
                placeholder="Submariner, Speedmaster, etc."
                className="w-full border dark:border-gray-700 dark:bg-gray-800 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Reference
              </label>
              <input
                type="text"
                value={incomingWatch.reference}
                onChange={(e) =>
                  setIncomingWatch({
                    ...incomingWatch,
                    reference: e.target.value,
                  })
                }
                placeholder="126610LN"
                className="w-full border dark:border-gray-700 dark:bg-gray-800 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Serial</label>
              <input
                type="text"
                value={incomingWatch.serial}
                onChange={(e) =>
                  setIncomingWatch({ ...incomingWatch, serial: e.target.value })
                }
                className="w-full border dark:border-gray-700 dark:bg-gray-800 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Year</label>
              <input
                type="text"
                value={incomingWatch.year}
                onChange={(e) =>
                  setIncomingWatch({ ...incomingWatch, year: e.target.value })
                }
                placeholder="2023"
                className="w-full border dark:border-gray-700 dark:bg-gray-800 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Condition
              </label>
              <input
                type="text"
                value={incomingWatch.condition}
                onChange={(e) =>
                  setIncomingWatch({
                    ...incomingWatch,
                    condition: e.target.value,
                  })
                }
                placeholder="Excellent, Good, Fair"
                className="w-full border dark:border-gray-700 dark:bg-gray-800 rounded-lg px-3 py-2"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Accessories
              </label>
              <input
                type="text"
                value={incomingWatch.accessories}
                onChange={(e) =>
                  setIncomingWatch({
                    ...incomingWatch,
                    accessories: e.target.value,
                  })
                }
                placeholder="Box, Papers, Extra Links, etc."
                className="w-full border dark:border-gray-700 dark:bg-gray-800 rounded-lg px-3 py-2"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea
                value={incomingWatch.notes}
                onChange={(e) =>
                  setIncomingWatch({ ...incomingWatch, notes: e.target.value })
                }
                rows={2}
                className="w-full border dark:border-gray-700 dark:bg-gray-800 rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <button
              onClick={() => setStep(2)}
              className="px-6 py-2 rounded-lg border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Back
            </button>
            <button
              onClick={handleSubmitTrade}
              disabled={!canSubmit || loading}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Processing..." : "Complete Trade"}
              {!loading && <Check size={16} />}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Complete */}
      {step === 4 && tradeResult && (
        <div className="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-lg p-6 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="text-green-600 dark:text-green-400" size={32} />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Trade Complete!</h2>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 my-6 text-left max-w-md mx-auto">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Traded away
                </p>
                <p className="font-medium">{tradeResult.summary.tradedAway}</p>
              </div>
              <ArrowRight className="text-gray-400" />
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Received
                </p>
                <p className="font-medium">{tradeResult.summary.received}</p>
              </div>
            </div>
            <div className="border-t dark:border-gray-700 pt-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">
                  Trade value:
                </span>
                <span>${tradeResult.summary.tradeValue.toLocaleString()}</span>
              </div>
              {tradeResult.summary.cashDifference !== 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">
                    Cash{" "}
                    {tradeResult.summary.cashDifference > 0
                      ? "received"
                      : "paid"}
                    :
                  </span>
                  <span>
                    $
                    {Math.abs(
                      tradeResult.summary.cashDifference
                    ).toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between font-medium">
                <span>Cost basis on new watch:</span>
                <span>${tradeResult.summary.costBasis.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <Link
              href={`/inventory/${tradeResult.incomingWatch.id}`}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              View New Watch
            </Link>
            <Link
              href="/inventory"
              className="px-6 py-2 rounded-lg border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Back to Inventory
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
