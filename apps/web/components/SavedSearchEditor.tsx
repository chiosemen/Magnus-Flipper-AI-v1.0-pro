"use client";

import { useState } from "react";

const CRON_PRESETS = [
  { label: "Every 5 minutes", value: "*/5 * * * *" },
  { label: "Every 15 minutes", value: "*/15 * * * *" },
  { label: "Every 30 minutes", value: "*/30 * * * *" },
  { label: "Every 60 minutes", value: "0 * * * *" },
  { label: "Every 360 minutes", value: "0 */6 * * *" },
  { label: "Daily 9am", value: "0 9 * * *" },
];

type SavedSearchEditorProps = {
  initial?: {
    query?: string;
    region?: string;
    cron?: string;
    priceDropPct?: number;
  };
  onSubmit: (data: {
    query: string;
    region: string;
    cron: string;
    priceDropPct?: number;
  }) => Promise<void>;
  onCancel?: () => void;
};

export function SavedSearchEditor({
  initial,
  onSubmit,
  onCancel,
}: SavedSearchEditorProps) {
  const [query, setQuery] = useState(initial?.query || "");
  const [region, setRegion] = useState<"US" | "UK">(
    (initial?.region as "US" | "UK") || "US"
  );
  const [cron, setCron] = useState(initial?.cron || "*/15 * * * *");
  const [priceDropPct, setPriceDropPct] = useState(
    initial?.priceDropPct || 10
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setSaving(true);
    try {
      await onSubmit({
        query: query.trim(),
        region,
        cron,
        priceDropPct: Number(priceDropPct),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="editor-query" className="block text-sm font-medium text-gray-700 mb-2">
          Search Query
        </label>
        <input
          id="editor-query"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g., iphone 16, macbook pro"
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      <div>
        <label htmlFor="editor-region" className="block text-sm font-medium text-gray-700 mb-2">
          Region
        </label>
        <select
          id="editor-region"
          value={region}
          onChange={(e) => setRegion(e.target.value as "US" | "UK")}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="US">United States</option>
          <option value="UK">United Kingdom</option>
        </select>
      </div>

      <div>
        <label htmlFor="editor-cron" className="block text-sm font-medium text-gray-700 mb-2">
          Schedule
        </label>
        <select
          id="editor-cron"
          value={cron}
          onChange={(e) => setCron(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {CRON_PRESETS.map((preset) => (
            <option key={preset.value} value={preset.value}>
              {preset.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="editor-threshold" className="block text-sm font-medium text-gray-700 mb-2">
          Alert if price drops ≥ (%)
        </label>
        <input
          id="editor-threshold"
          type="number"
          min="0"
          max="100"
          value={priceDropPct}
          onChange={(e) => setPriceDropPct(Number(e.target.value))}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving || !query.trim()}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save Search"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
