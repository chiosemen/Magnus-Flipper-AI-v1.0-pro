"use client";

import { useState } from "react";

type Marketplace = "facebook" | "vinted";

interface CreateSearchProps {
  marketplace: Marketplace;
  onCreated?: () => void;
}

export function CreateSearch({ marketplace, onCreated }: CreateSearchProps) {
  const [keywords, setKeywords] = useState("");
  const [minPrice, setMinPrice] = useState<number | "">("");
  const [maxPrice, setMaxPrice] = useState<number | "">("");
  const [distance, setDistance] = useState<number | "">("");
  const [condition, setCondition] = useState<string>("any");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Parse and validate keywords
      const keywordArray = keywords.split(",").map(k => k.trim()).filter(Boolean);
      
      if (keywordArray.length === 0) {
        throw new Error("Please enter at least one keyword");
      }

      // Client-side validation
      if (minPrice !== "" && minPrice < 0) {
        throw new Error("Min price must be >= 0");
      }

      if (maxPrice !== "" && maxPrice < 0) {
        throw new Error("Max price must be >= 0");
      }

      if (minPrice !== "" && maxPrice !== "" && maxPrice < minPrice) {
        throw new Error("Max price must be >= min price");
      }

      if (distance !== "" && distance < 0) {
        throw new Error("Distance must be >= 0");
      }

      // Auto-generate name from keywords
      const name = keywordArray.join(" ");

      // Map condition: "any" becomes null, single value becomes array
      const conditionArray = condition === "any" ? undefined : [condition];

      // Guardrail: UI must never trigger scraping. This creates a saved_searches row only.
      const res = await fetch("/api/searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marketplace,
          name,
          keywords: keywordArray,
          minPrice: minPrice === "" ? undefined : minPrice,
          maxPrice: maxPrice === "" ? undefined : maxPrice,
          maxDistanceMiles: distance === "" ? undefined : distance,
          condition: conditionArray,
        }),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to create search");
      }

      // Reset form
      setKeywords("");
      setMinPrice("");
      setMaxPrice("");
      setDistance("");
      setCondition("any");

      // Call success callback
      onCreated?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-white/10 p-6 bg-black/40">
      <h3 className="text-lg font-semibold">Create Search</h3>

      {/* Keywords */}
      <div>
        <label className="block text-sm mb-1">Keywords</label>
        <input
          type="text"
          placeholder='e.g. "PS5, PlayStation, Console"'
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          className="w-full rounded-md bg-black/60 border border-white/10 px-3 py-2"
          required
        />
        <p className="text-xs text-white/50 mt-1">Comma-separated</p>
      </div>

      {/* Price */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm mb-1">Min Price</label>
          <input
            type="number"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value === "" ? "" : Number(e.target.value))}
            className="w-full rounded-md bg-black/60 border border-white/10 px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Max Price</label>
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value === "" ? "" : Number(e.target.value))}
            className="w-full rounded-md bg-black/60 border border-white/10 px-3 py-2"
          />
        </div>
      </div>

      {/* Distance */}
      <div>
        <label className="block text-sm mb-1">Distance (miles)</label>
        <input
          type="number"
          value={distance}
          onChange={(e) => setDistance(e.target.value === "" ? "" : Number(e.target.value))}
          className="w-full rounded-md bg-black/60 border border-white/10 px-3 py-2"
        />
      </div>

      {/* Condition */}
      <div>
        <label className="block text-sm mb-1">Condition</label>
        <select
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
          className="w-full rounded-md bg-black/60 border border-white/10 px-3 py-2"
        >
          <option value="any">Any</option>
          <option value="new">New</option>
          <option value="like_new">Like New</option>
          <option value="used">Used</option>
        </select>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-blue-600 hover:bg-blue-500 transition px-4 py-2 font-medium disabled:opacity-50"
      >
        {loading ? "Creating…" : "Create Search"}
      </button>
    </form>
  );
}
