"use client";

import { useState } from "react";

type Item = {
  title: string;
  price?: string;
  url: string;
  location?: string;
};

export default function LiveTestPage() {
  const [marketplace, setMarketplace] = useState("facebook");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    setItems([]);

    try {
      const res = await fetch("/api/live-scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marketplace,
          query,
          limit: 50,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed");
      }

      setItems(json.items || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Live Marketplace Scrape Test</h1>
        <p className="text-slate-500 text-sm">
          Facebook Marketplace & Vinted · Real Data · No Login
        </p>
      </div>

      <div className="space-y-3">
        <select
          value={marketplace}
          onChange={(e) => setMarketplace(e.target.value)}
          className="border rounded px-2 py-2 text-sm"
        >
          <option value="facebook">Facebook Marketplace</option>
          <option value="vinted">Vinted</option>
        </select>

        <input
          placeholder="Search e.g. MacBook Pro, iPhone 14"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="block w-full max-w-md border rounded px-3 py-2"
        />

        <button
          onClick={run}
          disabled={loading || !query}
          className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? "Running…" : "Run Live Scrape"}
        </button>
      </div>

      {error && <p className="text-red-500">{error}</p>}

      <ul className="space-y-2">
        {items.map((item, idx) => (
          <li key={`${item.url}-${idx}`}>
            <a href={item.url} target="_blank" rel="noreferrer" className="underline">
              {item.title}
            </a>{" "}
            {item.price && `– ${item.price}`}{" "}
            {item.location && <span>({item.location})</span>}
          </li>
        ))}
      </ul>
    </main>
  );
}
