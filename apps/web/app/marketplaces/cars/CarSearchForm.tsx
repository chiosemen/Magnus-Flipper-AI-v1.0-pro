"use client";

import { useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useRegion } from "@/providers/RegionProvider";
import { Button } from "../../../marketing-swoopa/components/ui/button";
import { toast } from "../../../marketing-swoopa/components/ui/use-toast";
import type { SavedSearchRow } from "../../../lib/supabase/types";

type Props = {
  onSearchCreated?: (search: SavedSearchRow) => void;
  disabled?: boolean;
};

type FormState = {
  make: string;
  model: string;
  minYear: string;
  maxYear: string;
  maxMileage: string;
  maxPrice: string;
  location: string;
  radiusKm: string;
};

const INITIAL_FORM: FormState = {
  make: "",
  model: "",
  minYear: "",
  maxYear: "",
  maxMileage: "",
  maxPrice: "",
  location: "",
  radiusKm: "",
};

function parseOptionalNumber(value: string) {
  const trimmed = value.trim();
  if (trimmed.length === 0) return undefined;
  const num = Number(trimmed);
  return Number.isFinite(num) ? num : undefined;
}

export default function CarSearchForm({ onSearchCreated, disabled }: Props) {
  const { user, openAuthModal } = useAuth();
  const { region } = useRegion();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled || loading) return;

    if (!user) {
      toast({
        title: "Sign in required",
        description: "Sign in to save searches and start monitoring.",
      });
      openAuthModal("login");
      return;
    }

    const minYear = parseOptionalNumber(form.minYear);
    const maxYear = parseOptionalNumber(form.maxYear);

    if (
      typeof minYear === "number" &&
      typeof maxYear === "number" &&
      minYear > maxYear
    ) {
      setError("Min Year cannot be greater than Max Year.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/searches?region=${encodeURIComponent(region)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          marketplace: "cars",
          make: form.make,
          model: form.model,
          minYear,
          maxYear,
          maxMileage: parseOptionalNumber(form.maxMileage),
          maxPrice: parseOptionalNumber(form.maxPrice),
          location: form.location,
          radiusKm: parseOptionalNumber(form.radiusKm),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const message = (data as any)?.error || "Failed to create search";
        toast({
          title: "Unable to save search",
          description: message,
        });
        throw new Error(message);
      }

      const data = await response.json().catch(() => ({}));
      if (data?.search) {
        onSearchCreated?.(data.search as SavedSearchRow);
      }

      setForm(INITIAL_FORM);

      toast({
        title: "Search saved",
        description: "Your search will monitor the live market pool automatically.",
      });

      try {
        document
          .getElementById("saved-searches")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      } catch {
        // ignore
      }
    } catch (err: any) {
      setError(err?.message || "Failed to create search");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-white/70">
            Make
          </label>
          <input
            value={form.make}
            onChange={(e) => setForm((prev) => ({ ...prev, make: e.target.value }))}
            placeholder="e.g., Toyota"
            className="w-full px-4 py-2 bg-[#121212] border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[#00E5FF]/50"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-white/70">
            Model
          </label>
          <input
            value={form.model}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, model: e.target.value }))
            }
            placeholder="e.g., Corolla"
            className="w-full px-4 py-2 bg-[#121212] border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[#00E5FF]/50"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-white/70">
            Min Year
          </label>
          <input
            inputMode="numeric"
            value={form.minYear}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, minYear: e.target.value }))
            }
            placeholder="e.g., 2015"
            className="w-full px-4 py-2 bg-[#121212] border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[#00E5FF]/50"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-white/70">
            Max Year
          </label>
          <input
            inputMode="numeric"
            value={form.maxYear}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, maxYear: e.target.value }))
            }
            placeholder="e.g., 2022"
            className="w-full px-4 py-2 bg-[#121212] border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[#00E5FF]/50"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-white/70">
            Max Mileage
          </label>
          <input
            inputMode="numeric"
            value={form.maxMileage}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, maxMileage: e.target.value }))
            }
            placeholder="e.g., 80000"
            className="w-full px-4 py-2 bg-[#121212] border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[#00E5FF]/50"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-white/70">
            Max Price
          </label>
          <input
            inputMode="numeric"
            value={form.maxPrice}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, maxPrice: e.target.value }))
            }
            placeholder="e.g., 12000"
            className="w-full px-4 py-2 bg-[#121212] border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[#00E5FF]/50"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-white/70">
            Location
          </label>
          <input
            value={form.location}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, location: e.target.value }))
            }
            placeholder="e.g., London"
            className="w-full px-4 py-2 bg-[#121212] border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[#00E5FF]/50"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-sm font-medium text-white/70">
            Radius (km)
          </label>
          <input
            inputMode="numeric"
            value={form.radiusKm}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, radiusKm: e.target.value }))
            }
            placeholder="e.g., 25"
            className="w-full px-4 py-2 bg-[#121212] border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[#00E5FF]/50"
          />
        </div>
      </div>

      {error && (
        <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={disabled || loading}
          className="bg-gradient-to-r from-[#00E5FF] to-[#7B2FFF] text-white"
        >
          {loading ? "Saving..." : "Save Search"}
        </Button>
      </div>
    </form>
  );
}
