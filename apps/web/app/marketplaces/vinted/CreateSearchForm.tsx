"use client";

import { useState } from "react";
import { Button } from "../../../marketing-swoopa/components/ui/button";

export default function CreateSearchForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    keywords: "",
    minPrice: "",
    maxPrice: "",
    maxDistanceMiles: "",
    condition: [] as string[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const keywords = formData.keywords
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k.length > 0);

      if (keywords.length === 0) {
        setError("Please enter at least one keyword");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/searches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name || keywords.join(" "),
          keywords,
          minPrice: formData.minPrice ? parseFloat(formData.minPrice) : undefined,
          maxPrice: formData.maxPrice ? parseFloat(formData.maxPrice) : undefined,
          maxDistanceMiles: formData.maxDistanceMiles
            ? parseFloat(formData.maxDistanceMiles)
            : undefined,
          condition:
            formData.condition.length > 0 ? formData.condition : undefined,
          marketplace: "vinted",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create search");
      }

      setSuccess(true);
      setFormData({
        name: "",
        keywords: "",
        minPrice: "",
        maxPrice: "",
        maxDistanceMiles: "",
        condition: [],
      });

      // Refresh page after 1 second to show new search
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Failed to create search");
    } finally {
      setLoading(false);
    }
  };

  const toggleCondition = (condition: string) => {
    setFormData((prev) => ({
      ...prev,
      condition: prev.condition.includes(condition)
        ? prev.condition.filter((c) => c !== condition)
        : [...prev.condition, condition],
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-white/70 mb-1">
          Search Name (optional)
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, name: e.target.value }))
          }
          placeholder="e.g., Nike Air Max"
          className="w-full px-4 py-2 bg-[#121212] border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[#00E5FF]/50"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white/70 mb-1">
          Keywords <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.keywords}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, keywords: e.target.value }))
          }
          placeholder="nike, air max, size 10 (comma-separated)"
          required
          className="w-full px-4 py-2 bg-[#121212] border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[#00E5FF]/50"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1">
            Min Price ($)
          </label>
          <input
            type="number"
            value={formData.minPrice}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, minPrice: e.target.value }))
            }
            placeholder="0"
            className="w-full px-4 py-2 bg-[#121212] border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[#00E5FF]/50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1">
            Max Price ($)
          </label>
          <input
            type="number"
            value={formData.maxPrice}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, maxPrice: e.target.value }))
            }
            placeholder="100"
            className="w-full px-4 py-2 bg-[#121212] border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[#00E5FF]/50"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-white/70 mb-1">
          Max Distance (miles)
        </label>
        <input
          type="number"
          value={formData.maxDistanceMiles}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              maxDistanceMiles: e.target.value,
            }))
          }
          placeholder="25"
          className="w-full px-4 py-2 bg-[#121212] border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[#00E5FF]/50"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white/70 mb-2">
          Condition
        </label>
        <div className="flex flex-wrap gap-2">
          {["new", "like_new", "good", "fair"].map((cond) => (
            <button
              key={cond}
              type="button"
              onClick={() => toggleCondition(cond)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                formData.condition.includes(cond)
                  ? "bg-[#00E5FF] text-black"
                  : "bg-[#121212] text-white/70 border border-white/10 hover:border-[#00E5FF]/50"
              }`}
            >
              {cond.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 text-sm">
          Search created successfully!
        </div>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-[#00E5FF] to-[#7B2FFF] hover:from-[#00E5FF]/90 hover:to-[#7B2FFF]/90 text-white font-extrabold"
      >
        {loading ? "Creating..." : "Create Search"}
      </Button>
    </form>
  );
}
