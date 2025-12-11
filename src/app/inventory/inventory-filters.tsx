"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { Download } from "lucide-react";

type Props = {
  sources: string[];
  platforms: string[];
  currentFilters: {
    q?: string;
    status?: string;
    source?: string;
    platform?: string;
  };
};

export default function InventoryFilters({
  sources,
  platforms,
  currentFilters,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(currentFilters.q || "");

  const updateFilters = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }

      router.push(`/inventory?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters("q", search);
  };

  const clearFilters = () => {
    setSearch("");
    router.push("/inventory");
  };

  const hasFilters =
    currentFilters.q ||
    currentFilters.status ||
    currentFilters.source ||
    currentFilters.platform;

  // Build export URL with current status filter
  const exportUrl = currentFilters.status
    ? `/api/export?status=${currentFilters.status}`
    : "/api/export";

  return (
    <div className="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-lg p-4 mb-6">
      <div className="flex flex-wrap gap-4">
        <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search brand, model, reference, serial..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 border dark:border-gray-700 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg text-sm hover:bg-gray-800 dark:hover:bg-gray-200"
            >
              Search
            </button>
          </div>
        </form>

        <select
          value={currentFilters.status || ""}
          onChange={(e) => updateFilters("status", e.target.value)}
          className="border dark:border-gray-700 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="in_stock">In Stock</option>
          <option value="sold">Sold</option>
          <option value="traded">Traded</option>
          <option value="consigned">Consigned</option>
        </select>

        {sources.length > 0 && (
          <select
            value={currentFilters.source || ""}
            onChange={(e) => updateFilters("source", e.target.value)}
            className="border dark:border-gray-700 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All Sources</option>
            {sources.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>
        )}

        {platforms.length > 0 && (
          <select
            value={currentFilters.platform || ""}
            onChange={(e) => updateFilters("platform", e.target.value)}
            className="border dark:border-gray-700 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All Platforms</option>
            {platforms.map((platform) => (
              <option key={platform} value={platform}>
                {platform}
              </option>
            ))}
          </select>
        )}

        <a
          href={exportUrl}
          download
          className="flex items-center gap-2 border dark:border-gray-700 rounded-lg px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <Download size={16} />
          Export CSV
        </a>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
