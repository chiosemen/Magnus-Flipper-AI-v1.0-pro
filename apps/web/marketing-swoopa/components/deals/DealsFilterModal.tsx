"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getSupportedMarketplacesForRegion } from "@magnus-flipper-ai/marketplace-config";
import { useRegion } from "@/providers/RegionProvider";
import { MOTION_TRANSITION, useMotionPrefs } from "@/lib/motion";
import { useMotionDebug } from "@/lib/motionDebug";

export type DealsFilterState = {
  searchIds: string[];
  minPrice: number | null;
  maxPrice: number | null;
  radius: number | null;
  hideDealers: boolean;
  hideSpam: boolean;
  marketplaces?: string[];
};

type SavedSearchOption = {
  id: string;
  name: string;
  marketplace: string;
};

type UserBlock = {
  id: string;
  marketplace: string;
  type: "seller" | "location" | "keyword";
  value: string;
  created_at: string;
};

function safeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function DealsFilterModal({
  open,
  onOpenChange,
  marketplaceSlug,
  searches,
  value,
  onChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  marketplaceSlug: string;
  searches: SavedSearchOption[];
  value: DealsFilterState;
  onChange: (next: DealsFilterState) => void;
}) {
  const { region } = useRegion();
  const motionPrefs = useMotionPrefs();
  const filteredSearches = useMemo(
    () => {
      const slug = marketplaceSlug.toLowerCase();
      if (slug === "all") return searches;
      return searches.filter((s) => s.marketplace?.toLowerCase?.() === slug);
    },
    [marketplaceSlug, searches]
  );

  const bounds = useMemo(() => {
    const slug = marketplaceSlug.toLowerCase();
    if (slug === "cars") return { max: 50_000, step: 250 };
    return { max: 2_000, step: 25 };
  }, [marketplaceSlug]);

  const [blocks, setBlocks] = useState<UserBlock[]>([]);
  const [blocksError, setBlocksError] = useState<string | null>(null);
  const [blocksLoading, setBlocksLoading] = useState(false);
  const [keywordDraft, setKeywordDraft] = useState("");
  const [locationDraft, setLocationDraft] = useState("");
  const [sellerDraft, setSellerDraft] = useState("");

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setBlocksError(null);
      setBlocksLoading(true);
      try {
        const res = await fetch(
          `/api/blocks?marketplace=${encodeURIComponent(marketplaceSlug.toLowerCase())}`,
          { cache: "no-store" }
        );
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          const msg = payload?.error || (res.status === 401 ? "Sign in to manage blocks." : "Failed to load blocks.");
          if (!cancelled) setBlocksError(msg);
          if (!cancelled) setBlocks([]);
          return;
        }
        const payload = await res.json();
        const rows = Array.isArray(payload?.blocks) ? (payload.blocks as UserBlock[]) : [];
        if (!cancelled) setBlocks(rows);
      } catch (err: any) {
        if (!cancelled) setBlocksError(err?.message || "Failed to load blocks.");
      } finally {
        if (!cancelled) setBlocksLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, marketplaceSlug]);

  const selected = new Set(value.searchIds);

  const toggleSearch = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange({ ...value, searchIds: Array.from(next) });
  };

  const marketplaceOptions = useMemo(
    () => {
      const includeOptional = process.env.NEXT_PUBLIC_ENABLE_SHPOCK === "true";
      const supported = getSupportedMarketplacesForRegion(region, { includeOptional });
      return supported.map((id) => ({
        id,
        label: id === "cars" ? "Cars" : id.charAt(0).toUpperCase() + id.slice(1),
      }));
    },
    [region]
  );

  const selectedMarketplaces = useMemo(() => {
    const list = Array.isArray(value.marketplaces)
      ? value.marketplaces.map((m) => safeText(m).toLowerCase()).filter(Boolean)
      : [];
    const supported = new Set(marketplaceOptions.map((m) => m.id));
    const unique = Array.from(new Set(list)).filter((m) => supported.has(m));
    if (unique.length > 0) return unique;
    // Default selection per region (always keep facebook + cars if supported).
    const defaults = ["facebook", "cars"].filter((m) => supported.has(m));
    return defaults.length > 0 ? defaults : Array.from(supported).slice(0, 2);
  }, [marketplaceOptions, value.marketplaces]);

  // When the modal opens, ensure the parent filter state doesn't retain hidden/unsupported marketplaces.
  useEffect(() => {
    if (!open) return;
    const current = Array.isArray(value.marketplaces) ? value.marketplaces : [];
    const next = selectedMarketplaces;
    if (current.length === 0 && next.length > 0) {
      onChange({ ...value, marketplaces: next });
      return;
    }
    const normalizedCurrent = current.map((m) => safeText(m).toLowerCase()).filter(Boolean);
    const same =
      normalizedCurrent.length === next.length &&
      normalizedCurrent.every((m) => next.includes(m));
    if (!same) {
      onChange({ ...value, marketplaces: next });
    }
  }, [open, onChange, region, selectedMarketplaces, value]);

  const toggleMarketplace = (id: string) => {
    const next = new Set(selectedMarketplaces);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange({ ...value, marketplaces: Array.from(next) });
  };

  const setMinPrice = (next: number | null) => {
    const min = next;
    const max = value.maxPrice;
    if (min !== null && max !== null && min > max) {
      onChange({ ...value, minPrice: min, maxPrice: min });
      return;
    }
    onChange({ ...value, minPrice: min });
  };

  const setMaxPrice = (next: number | null) => {
    const min = value.minPrice;
    const max = next;
    if (min !== null && max !== null && max < min) {
      onChange({ ...value, maxPrice: max, minPrice: max });
      return;
    }
    onChange({ ...value, maxPrice: max });
  };

  const clearAll = () => {
    onChange({
      searchIds: [],
      minPrice: null,
      maxPrice: null,
      radius: null,
      hideDealers: false,
      hideSpam: false,
    });
  };

  const addBlock = async (type: UserBlock["type"], raw: string) => {
    const nextValue = safeText(raw);
    if (!nextValue) return;

    const res = await fetch("/api/blocks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        marketplace: marketplaceSlug.toLowerCase(),
        type,
        value: nextValue,
      }),
    });

    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      throw new Error(payload?.error || "Failed to save block");
    }

    const payload = await res.json();
    const block = payload?.block as UserBlock | undefined;
    if (block?.id) {
      setBlocks((prev) => {
        const exists = prev.some((b) => b.id === block.id);
        return exists ? prev : [block, ...prev];
      });
    }
  };

  const removeBlock = async (id: string) => {
    const res = await fetch("/api/blocks", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      throw new Error(payload?.error || "Failed to delete block");
    }
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const blocksByType = useMemo(() => {
    const grouped: Record<UserBlock["type"], UserBlock[]> = {
      keyword: [],
      location: [],
      seller: [],
    };
    for (const block of blocks) {
      if (block.type === "keyword") grouped.keyword.push(block);
      if (block.type === "location") grouped.location.push(block);
      if (block.type === "seller") grouped.seller.push(block);
    }
    return grouped;
  }, [blocks]);

  const overlayMotionProps = motionPrefs.reducedMotion
    ? {}
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: MOTION_TRANSITION.fade,
      };

  const panelMotionProps = motionPrefs.reducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 16 },
        transition: MOTION_TRANSITION.sheet,
      };

  const debugBackdrop = useMotionDebug({
    label: "DealsFilterModal:Backdrop",
    type: "transition",
    durationMs: Math.round((MOTION_TRANSITION.fade.duration ?? 0) * 1000),
  });
  const debugPanel = useMotionDebug({
    label: "DealsFilterModal:Panel",
    type: "transition",
    durationMs: Math.round((MOTION_TRANSITION.sheet.duration ?? 0) * 1000),
  });

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => onOpenChange(false)}
          {...overlayMotionProps}
          {...debugBackdrop}
        >
          <motion.div
            className="w-full sm:max-w-lg bg-[#0F0F0F] border border-white/10 rounded-t-2xl sm:rounded-2xl p-5"
            onClick={(e) => e.stopPropagation()}
            {...panelMotionProps}
            {...debugPanel}
          >
        <div className="flex items-center justify-between mb-4">
          <div className="text-white font-extrabold tracking-tight">Filters</div>
          <button
            type="button"
            className="text-white/70 hover:text-white text-sm font-semibold"
            onClick={() => onOpenChange(false)}
          >
            Close
          </button>
        </div>

        <div className="space-y-4">
          {marketplaceSlug.toLowerCase() === "all" && (
            <div>
              <div className="text-xs text-white/60 font-semibold mb-2">
                Marketplaces
              </div>
              <div className="flex flex-wrap gap-2">
                {marketplaceOptions.map((m) => (
                  <label
                    key={m.id}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-xs font-semibold text-white/80 cursor-pointer hover:border-white/20"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[#00E5FF]"
                      checked={selectedMarketplaces.includes(m.id)}
                      onChange={() => toggleMarketplace(m.id)}
                    />
                    {m.label}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="text-xs text-white/60 font-semibold mb-2">
              Saved Searches
            </div>
            {filteredSearches.length === 0 ? (
              <div className="text-sm text-white/50">
                No saved searches for this marketplace yet.
              </div>
            ) : (
              <div className="space-y-2 max-h-44 overflow-auto pr-1">
                {filteredSearches.map((search) => (
                  <label
                    key={search.id}
                    className="flex items-center gap-2 text-sm text-white/80 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-[#00E5FF]"
                      checked={selected.has(search.id)}
                      onChange={() => toggleSearch(search.id)}
                    />
                    <span className="truncate">{search.name || "Saved search"}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center gap-2 text-sm text-white/80 cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[#00E5FF]"
                checked={value.hideDealers}
                onChange={(e) => onChange({ ...value, hideDealers: e.target.checked })}
              />
              Hide dealers
            </label>
            <label className="flex items-center gap-2 text-sm text-white/80 cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[#00E5FF]"
                checked={value.hideSpam}
                onChange={(e) => onChange({ ...value, hideSpam: e.target.checked })}
              />
              Hide likely spam
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-white/60 font-semibold mb-2">
                Min Price
              </div>
              <input
                type="range"
                min={0}
                max={bounds.max}
                step={bounds.step}
                value={value.minPrice ?? 0}
                onChange={(e) => setMinPrice(Number(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-white/70 mt-1">
                {value.minPrice ?? 0}
              </div>
            </div>

            <div>
              <div className="text-xs text-white/60 font-semibold mb-2">
                Max Price
              </div>
              <input
                type="range"
                min={0}
                max={bounds.max}
                step={bounds.step}
                value={value.maxPrice ?? bounds.max}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-white/70 mt-1">
                {value.maxPrice ?? bounds.max}
              </div>
            </div>
          </div>

          <div>
            <div className="text-xs text-white/60 font-semibold mb-2">
              Radius (approx)
            </div>
            <input
              type="range"
              min={1}
              max={100}
              step={1}
              value={value.radius ?? 25}
              onChange={(e) =>
                onChange({ ...value, radius: Number(e.target.value) })
              }
              className="w-full"
            />
            <div className="text-xs text-white/70 mt-1">
              {value.radius ?? 25}
            </div>
            <div className="text-[11px] text-white/45 mt-1">
              Radius is UI-only until geo pooling is enabled.
            </div>
          </div>

          <div className="pt-2 border-t border-white/10">
            <div className="text-xs text-white/60 font-semibold mb-2">
              Blocks (applied server-side)
            </div>
            <div className="text-[11px] text-white/45 mb-3">
              Blocks filter pooled deals only and never trigger scraping.
            </div>

            {blocksLoading ? (
              <div className="text-sm text-white/50">Loading blocks…</div>
            ) : blocksError ? (
              <div className="text-sm text-white/50">{blocksError}</div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <div className="text-[11px] text-white/60 font-semibold mb-2">
                      Anti-keywords
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={keywordDraft}
                        onChange={(e) => setKeywordDraft(e.target.value)}
                        placeholder="e.g. locked"
                        className="w-full rounded-lg bg-[#0F0F0F] border border-white/10 px-3 py-2 text-xs text-white"
                      />
                      <button
                        type="button"
                        className="px-3 py-2 rounded-lg text-xs font-extrabold bg-white/10 border border-white/10 hover:border-[#00E5FF]/40"
                        onClick={() => {
                          setBlocksError(null);
                          addBlock("keyword", keywordDraft)
                            .then(() => setKeywordDraft(""))
                            .catch((err) => setBlocksError(err?.message || "Failed to save block"));
                        }}
                      >
                        Add
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {blocksByType.keyword.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          className="inline-flex items-center gap-2 px-2 py-1 rounded-full border border-white/10 bg-white/5 text-[11px] text-white/70 hover:border-red-400/40"
                          onClick={() => {
                            setBlocksError(null);
                            removeBlock(b.id).catch((err) => setBlocksError(err?.message || "Failed to delete block"));
                          }}
                          title="Remove"
                        >
                          {b.value}
                          <span className="text-white/40">×</span>
                        </button>
                      ))}
                      {blocksByType.keyword.length === 0 && (
                        <span className="text-[11px] text-white/45">None</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-white/60 font-semibold mb-2">
                      Block locations
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={locationDraft}
                        onChange={(e) => setLocationDraft(e.target.value)}
                        placeholder="e.g. Croydon"
                        className="w-full rounded-lg bg-[#0F0F0F] border border-white/10 px-3 py-2 text-xs text-white"
                      />
                      <button
                        type="button"
                        className="px-3 py-2 rounded-lg text-xs font-extrabold bg-white/10 border border-white/10 hover:border-[#00E5FF]/40"
                        onClick={() => {
                          setBlocksError(null);
                          addBlock("location", locationDraft)
                            .then(() => setLocationDraft(""))
                            .catch((err) => setBlocksError(err?.message || "Failed to save block"));
                        }}
                      >
                        Add
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {blocksByType.location.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          className="inline-flex items-center gap-2 px-2 py-1 rounded-full border border-white/10 bg-white/5 text-[11px] text-white/70 hover:border-red-400/40"
                          onClick={() => {
                            setBlocksError(null);
                            removeBlock(b.id).catch((err) => setBlocksError(err?.message || "Failed to delete block"));
                          }}
                          title="Remove"
                        >
                          {b.value}
                          <span className="text-white/40">×</span>
                        </button>
                      ))}
                      {blocksByType.location.length === 0 && (
                        <span className="text-[11px] text-white/45">None</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-white/60 font-semibold mb-2">
                      Block sellers
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={sellerDraft}
                        onChange={(e) => setSellerDraft(e.target.value)}
                        placeholder="e.g. AutoHub"
                        className="w-full rounded-lg bg-[#0F0F0F] border border-white/10 px-3 py-2 text-xs text-white"
                      />
                      <button
                        type="button"
                        className="px-3 py-2 rounded-lg text-xs font-extrabold bg-white/10 border border-white/10 hover:border-[#00E5FF]/40"
                        onClick={() => {
                          setBlocksError(null);
                          addBlock("seller", sellerDraft)
                            .then(() => setSellerDraft(""))
                            .catch((err) => setBlocksError(err?.message || "Failed to save block"));
                        }}
                      >
                        Add
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {blocksByType.seller.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          className="inline-flex items-center gap-2 px-2 py-1 rounded-full border border-white/10 bg-white/5 text-[11px] text-white/70 hover:border-red-400/40"
                          onClick={() => {
                            setBlocksError(null);
                            removeBlock(b.id).catch((err) => setBlocksError(err?.message || "Failed to delete block"));
                          }}
                          title="Remove"
                        >
                          {b.value}
                          <span className="text-white/40">×</span>
                        </button>
                      ))}
                      {blocksByType.seller.length === 0 && (
                        <span className="text-[11px] text-white/45">None</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 mt-6">
          <button
            type="button"
            className="text-sm font-semibold text-white/70 hover:text-white"
            onClick={clearAll}
          >
            Clear
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-extrabold bg-gradient-to-r from-[#00E5FF] to-[#7B2FFF] text-white"
            onClick={() => onOpenChange(false)}
          >
            Apply
          </button>
        </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
