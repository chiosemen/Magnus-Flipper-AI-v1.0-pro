"use client";

import { useState } from "react";
import { Button } from "../../../marketing-swoopa/components/ui/button";
import { supabaseBrowser } from "@/lib/supabase/client";

type Props = {
  onSearchCreated?: (search: any) => void;
  disabled?: boolean;
};

export default function CreateSearchForm({ onSearchCreated, disabled }: Props) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);

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
    if (disabled) return;
    if (step < 5) {
      setStep((s) => Math.min(5, s + 1));
      return;
    }
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

      // POOLED-ONLY: Write intent to saved_searches (Supabase)
      // Pooled scraper will populate public.scraped_listings independently
      const supabase = supabaseBrowser();

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        throw new Error("You must be logged in to save searches");
      }

      const searchIntent = {
        user_id: userData.user.id,
        name: formData.name || keywords.join(" "),
        marketplace: "facebook",
        query: keywords.join(" "),
        filters: {
          keywords,
          minPrice: formData.minPrice ? parseFloat(formData.minPrice) : null,
          maxPrice: formData.maxPrice ? parseFloat(formData.maxPrice) : null,
          maxDistanceMiles: formData.maxDistanceMiles ? parseFloat(formData.maxDistanceMiles) : null,
          condition: formData.condition.length > 0 ? formData.condition : null,
        },
        is_active: true,
      };

      const { data: savedSearch, error: saveError } = await supabase
        .from("saved_searches")
        .insert(searchIntent)
        .select()
        .single();

      if (saveError) {
        throw new Error(saveError.message || "Failed to save search");
      }

      setSuccess(true);
      onSearchCreated?.(savedSearch);

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
      <div className="text-sm text-white/60 font-medium">Step {step} / 5</div>

      {step === 1 && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">
              Select Device / Category
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="e.g., iPhone 15 Pro"
              className="w-full px-4 py-2 bg-[#121212] border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[#00E5FF]/50"
            />
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={() => setStep(2)}
              className="bg-gradient-to-r from-[#00E5FF] to-[#7B2FFF] text-white"
              disabled={disabled}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">
              Select Models (series + variants) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.keywords}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, keywords: e.target.value }))
              }
              placeholder="iphone, 15 pro, 256gb (comma-separated)"
              required
              className="w-full px-4 py-2 bg-[#121212] border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[#00E5FF]/50"
            />
          </div>
          <div className="flex justify-between">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setStep(1)}
              className="text-white bg-transparent border border-white/20"
            >
              Back
            </Button>
            <Button
              type="button"
              onClick={() => setStep(3)}
              className="bg-gradient-to-r from-[#00E5FF] to-[#7B2FFF] text-white"
              disabled={disabled}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">
              Location + Radius (miles)
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
          <div className="flex justify-between">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setStep(2)}
              className="text-white bg-transparent border border-white/20"
            >
              Back
            </Button>
            <Button
              type="button"
              onClick={() => setStep(4)}
              className="bg-gradient-to-r from-[#00E5FF] to-[#7B2FFF] text-white"
              disabled={disabled}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
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
                placeholder="1000"
                className="w-full px-4 py-2 bg-[#121212] border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[#00E5FF]/50"
              />
            </div>
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

          <div className="flex justify-between">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setStep(3)}
              className="text-white bg-transparent border border-white/20"
            >
              Back
            </Button>
            <Button
              type="button"
              onClick={() => setStep(5)}
              className="bg-gradient-to-r from-[#00E5FF] to-[#7B2FFF] text-white"
              disabled={disabled}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-3">
          <div className="text-white font-semibold">Review & Create</div>
          <div className="text-sm text-white/70 space-y-1">
            <div>Device: {formData.name || "N/A"}</div>
            <div>Keywords: {formData.keywords || "N/A"}</div>
            <div>
              Price: {formData.minPrice || "—"} - {formData.maxPrice || "—"}
            </div>
            <div>
              Location / Radius: {formData.maxDistanceMiles || "N/A"} miles
            </div>
            <div>
              Condition:{" "}
              {formData.condition.length > 0
                ? formData.condition.join(", ")
                : "Any"}
            </div>
          </div>

          <div className="p-3 bg-blue-500/20 border border-blue-500/50 rounded-lg text-blue-300 text-xs">
            📌 Your search will be saved and monitored. Live deals appear below from our pooled marketplace scraper.
          </div>

          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 text-sm">
              Search saved successfully! Pooled deals will appear below.
            </div>
          )}

          <div className="flex justify-between items-center">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setStep(4)}
              className="text-white bg-transparent border border-white/20"
            >
              Back
            </Button>
            <Button
              type="submit"
              disabled={loading || disabled}
              className="bg-gradient-to-r from-[#00E5FF] to-[#7B2FFF] hover:from-[#00E5FF]/90 hover:to-[#7B2FFF]/90 text-white font-extrabold"
            >
              {loading ? "Saving..." : "Save Search"}
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}
