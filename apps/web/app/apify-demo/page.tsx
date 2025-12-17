"use client";

import { useState } from "react";
import { LiveResults } from "../../components/LiveResults";

export default function ApifyDemoPage() {
  const [jobs, setJobs] = useState([
    { marketplace: "facebook", query: "" },
  ]);
  const [datasetIds, setDatasetIds] = useState<string[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startRun = async () => {
    const payload = jobs
      .filter((j) => j.query.trim().length > 0)
      .slice(0, 10);

    if (payload.length === 0) {
      setError("Please enter at least one query");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/apify/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to start scrapes");
        return;
      }
      const successful = (data.runs || []).filter((r: any) => r.datasetId);
      if (successful.length === 0) {
        setError("All runs failed. Check logs.");
        return;
      }
      setDatasetIds(successful.map((r: any) => r.datasetId));
      try {
        const items = await Promise.all(
          successful.map(async (r: any) => {
            const resItems = await fetch(
              `/api/apify/dataset?datasetId=${r.datasetId}`
            );
            if (!resItems.ok) return [];
            const data = await resItems.json();
            return (data.items || []) as any[];
          })
        );
        setResults(items.flat());
        console.log("apify-dataset-items", items.flat());
      } catch (fetchErr: any) {
        console.error("Failed to fetch dataset items", fetchErr);
      }
    } catch (err: any) {
      setError("Unexpected error starting scrapes");
    } finally {
      setLoading(false);
    }
  };

  const updateJob = (index: number, key: string, value: string) => {
    setJobs((prev) =>
      prev.map((job, i) => (i === index ? { ...job, [key]: value } : job))
    );
  };

  const addJob = () => {
    if (jobs.length >= 10) return;
    setJobs((prev) => [...prev, { marketplace: "facebook", query: "" }]);
  };

  const removeJob = (index: number) => {
    setJobs((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Live Marketplace Scrape (Apify)</h1>
        <p className="text-slate-500 text-sm">
          Triggers an Apify actor server-side, then streams results by polling
          the dataset every ~1.5s. No Supabase/queues—pure Apify for demo
          speed.
        </p>
        <div className="space-y-3">
          {jobs.map((job, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <select
                value={job.marketplace}
                onChange={(e) => updateJob(idx, "marketplace", e.target.value)}
                className="border rounded px-2 py-2 text-sm"
              >
                <option value="facebook">Facebook</option>
                <option value="gumtree">Gumtree</option>
                <option value="vinted">Vinted</option>
              </select>
              <input
                className="flex-1 border rounded px-3 py-2"
                placeholder="Search query"
                value={job.query}
                onChange={(e) => updateJob(idx, "query", e.target.value)}
              />
              {job.marketplace === "vinted" ? (
                <input
                  className="w-24 border rounded px-2 py-2 text-sm"
                  placeholder="Country"
                  value={(job as any).country || ""}
                  onChange={(e) => updateJob(idx, "country", e.target.value)}
                />
              ) : (
                <input
                  className="w-32 border rounded px-2 py-2 text-sm"
                  placeholder="Location (optional)"
                  value={(job as any).location || ""}
                  onChange={(e) => updateJob(idx, "location", e.target.value)}
                />
              )}
              {jobs.length > 1 && (
                <button
                  onClick={() => removeJob(idx)}
                  className="text-xs text-red-500"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <div className="flex gap-3">
            <button
              onClick={addJob}
              disabled={jobs.length >= 10}
              className="text-sm text-slate-700 underline disabled:opacity-50"
            >
              + Add job (max 10)
            </button>
            <button
              onClick={startRun}
              disabled={loading}
              className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {loading ? "Starting…" : "Start scrapes"}
            </button>
          </div>
        </div>
        {error && <div className="text-red-500 text-sm">{error}</div>}
      </div>

      {datasetIds.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-slate-500">
            Datasets: {datasetIds.join(", ")}
          </div>
          <LiveResults datasetIds={datasetIds} />
          {results.length > 0 && (
            <div className="text-xs text-slate-500">
              Loaded {results.length} items directly from datasets.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
