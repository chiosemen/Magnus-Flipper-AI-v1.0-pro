"use client";

import Link from "next/link";
import { ArrowLeft, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Header from "../../../marketing-swoopa/components/Header";
import Footer from "../../../marketing-swoopa/components/Footer";
import MarketplaceStatus from "../[slug]/MarketplaceStatus";
import CarSearchForm from "./CarSearchForm";
import { useAuth } from "@/providers/AuthProvider";
import { useRegion } from "@/providers/RegionProvider";
import { MOTION_TRANSITION, useMotionPrefs } from "@/lib/motion";
import { useMotionSeverity } from "@/lib/motionSeverity";
import { useHydratedNow } from "@/lib/hydratedTime";
import { useIsHydrated } from "@/providers/HydrationProvider";
import type { DealRow, SavedSearchRow } from "../../../lib/supabase/types";
import { SavedSearchMosaic } from "../../../components/SavedSearchMosaic";
import CarDealsGrid from "../../../marketing-swoopa/components/CarDealsGrid";
import {
  DealsFilterModal,
  type DealsFilterState,
} from "../../../marketing-swoopa/components/deals/DealsFilterModal";
import { useViewerTier } from "../../../marketing-swoopa/components/deals/useViewerTier";

// TODO(car-pooling): Define car pool registry + cadence in the worker/scheduler layer.
// This page must remain control-plane only: write `saved_searches`, read `deals`, and never trigger scraping.

type SavedSearch = {
  id: string;
  name: string;
  marketplace: string;
  params: Record<string, any>;
  status: string;
  createdAt: number;
  dealCount: number;
  previewImage: string | null;
  previewImages: string[];
};

function timeAgo(ts: number, nowMs: number | null) {
  if (typeof nowMs !== "number" || !Number.isFinite(nowMs)) return "just now";
  const diff = nowMs - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.floor(hours / 24);
  return `${days} d ago`;
}

function parseNumericFilter(value: any) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (
    typeof value === "string" &&
    value.trim() !== "" &&
    Number.isFinite(Number(value))
  ) {
    return Number(value);
  }
  return null;
}

function getSearchSummary(params: Record<string, any>) {
  const keywords = Array.isArray(params?.keywords)
    ? params.keywords.filter(Boolean).join(", ")
    : typeof params?.query === "string"
    ? params.query
    : "";

  const location =
    typeof params?.location === "string" && params.location.trim().length > 0
      ? params.location.trim()
      : null;

  const radius =
    parseNumericFilter(params?.maxDistanceMiles ?? params?.radius) ?? undefined;

  const minPrice = parseNumericFilter(params?.minPrice ?? params?.min_price);
  const maxPrice = parseNumericFilter(params?.maxPrice ?? params?.max_price);

  const filters: string[] = [];

  if (minPrice !== null || maxPrice !== null) {
    const min = minPrice !== null ? `$${minPrice}` : "$0";
    const max = maxPrice !== null ? `$${maxPrice}` : "Any";
    filters.push(`Price: ${min} - ${max}`);
  }

  if (radius !== undefined && radius !== null) {
    filters.push(`${radius} mi radius`);
  }

  const conditions = Array.isArray(params?.condition)
    ? params.condition.filter(Boolean).map(String)
    : [];

  if (conditions.length > 0) {
    filters.push(`Condition: ${conditions.join(", ")}`);
  }

  return {
    keywords,
    location,
    filters,
  };
}

function getCarSearchSummary(params: Record<string, any>) {
  const make = typeof params?.make === "string" ? params.make.trim() : "";
  const model = typeof params?.model === "string" ? params.model.trim() : "";
  const makeModel = [make, model].filter(Boolean).join(" ") || "Any";

  const minYear = parseNumericFilter(params?.minYear);
  const maxYear = parseNumericFilter(params?.maxYear);
  const yearRange =
    minYear !== null || maxYear !== null
      ? `${minYear ?? "Any"} - ${maxYear ?? "Any"}`
      : null;

  const maxPrice = parseNumericFilter(params?.maxPrice);

  return { makeModel, yearRange, maxPrice };
}

export default function CarsMarketplacePage() {
  const { user, loading: authLoading, openAuthModal } = useAuth();
  const { region } = useRegion();
  const motionPrefs = useMotionPrefs();
  const hydrated = useIsHydrated();
  const now = useHydratedNow();
  const { tier } = useViewerTier();
  const motionSeverity = useMotionSeverity(tier);

  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [loadingSavedSearches, setLoadingSavedSearches] = useState(true);
  const [dealFiltersOpen, setDealFiltersOpen] = useState(false);
  const [dealFilters, setDealFilters] = useState<DealsFilterState>({
    searchIds: [],
    minPrice: null,
    maxPrice: null,
    radius: null,
    hideDealers: false,
    hideSpam: false,
  });
  const [selectedSearchId, setSelectedSearchId] = useState<string | null>(null);
  const [selectedSearchDeals, setSelectedSearchDeals] = useState<DealRow[] | null>(
    null
  );
  const [loadingSelectedSearchDeals, setLoadingSelectedSearchDeals] =
    useState(false);
  const [selectedSearchDealsError, setSelectedSearchDealsError] = useState<
    string | null
  >(null);
  const activeDealsRequestIdRef = useRef(0);

  const mapSearch = (row: SavedSearchRow): SavedSearch => ({
    id: row.id,
    name: row.name || row.params?.query || "Saved search",
    marketplace:
      typeof row.marketplace === "string" && row.marketplace.trim().length > 0
        ? row.marketplace.trim().toLowerCase()
        : "cars",
    params: row.params || {},
    status: row.status || "active",
    createdAt: row.last_updated_at
      ? new Date(row.last_updated_at).getTime()
      : row.updated_at
      ? new Date(row.updated_at).getTime()
      : row.created_at
      ? new Date(row.created_at).getTime()
      : Date.now(),
    dealCount: typeof row.deal_count === "number" ? row.deal_count : 0,
    previewImage: typeof row.preview_image === "string" ? row.preview_image : null,
    previewImages: Array.isArray(row.preview_images)
      ? row.preview_images.filter((v) => typeof v === "string" && v.trim().length > 0).slice(0, 4)
      : typeof row.preview_image === "string" && row.preview_image.trim().length > 0
      ? [row.preview_image.trim()]
      : [],
  });

  useEffect(() => {
    (async () => {
      if (authLoading) return;
      if (!user) {
        setSavedSearches([]);
        setLoadingSavedSearches(false);
        return;
      }

      try {
        setLoadingSavedSearches(true);
        // Read-only: loads saved_searches for the signed-in user. This does not enqueue scrapes.
        const res = await fetch(`/api/searches?region=${encodeURIComponent(region)}`);
        if (!res.ok) return;
        const payload = await res.json();
        const mapped: SavedSearch[] = Array.isArray(payload?.searches)
          ? (payload.searches as SavedSearchRow[]).map(mapSearch)
          : [];
        setSavedSearches(mapped.slice(0, 10));
      } catch (error) {
        console.warn("Saved search load skipped", error);
      } finally {
        setLoadingSavedSearches(false);
      }
    })();
  }, [authLoading, user?.id, region]);

  const loadDealsForSearch = async (searchId: string) => {
    activeDealsRequestIdRef.current += 1;
    const requestId = activeDealsRequestIdRef.current;

    setLoadingSelectedSearchDeals(true);
    setSelectedSearchDealsError(null);

    try {
      // Read-only: loads deals rows by search_id. This must never enqueue scrapes.
      const res = await fetch(
        `/api/deals?region=${encodeURIComponent(region)}&searchId=${encodeURIComponent(searchId)}`
      );
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        const message =
          (payload as any)?.error || "Failed to load matched deals";
        throw new Error(message);
      }

      const payload = await res.json();
      const deals = Array.isArray(payload?.deals)
        ? (payload.deals as DealRow[])
        : [];

      if (activeDealsRequestIdRef.current !== requestId) return;
      setSelectedSearchDeals(deals);
    } catch (error: any) {
      if (activeDealsRequestIdRef.current !== requestId) return;
      console.warn("Failed to load deals for selected search", error);
      setSelectedSearchDeals([]);
      setSelectedSearchDealsError(
        error?.message || "Failed to load matched deals"
      );
    } finally {
      if (activeDealsRequestIdRef.current === requestId) {
        setLoadingSelectedSearchDeals(false);
      }
    }
  };

  const handleSearchCreated = (search?: SavedSearchRow) => {
    if (!search) return;
    const mapped = mapSearch(search);
    setSavedSearches((prev) => [mapped, ...prev].slice(0, 10));
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="relative pt-32 pb-16 overflow-hidden bg-[#0A0A0A]">
          <div className="absolute inset-0 gradient-hero" />
          <div className="absolute top-1/2 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-[#00E5FF]/40 to-[#7B2FFF]/40 blur-3xl opacity-30 -translate-y-1/2" />

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-4xl mx-auto">
              <Link
                href="/marketplaces"
                className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm font-medium mb-8 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to all marketplaces
              </Link>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-[#00E5FF]/20 to-[#7B2FFF]/20 rounded-2xl flex items-center justify-center border border-[#00E5FF]/30">
                  <Zap className="w-8 h-8 text-[#00E5FF]" />
                </div>
                <div>
                  <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-2 tracking-tight">
                    Get Real-Time Used Car Deals Before Anyone Else
                  </h1>
                  <p className="text-white/80 text-lg font-medium">
                    Real-time deal intelligence for car flipping
                  </p>
                </div>
              </div>

              <MarketplaceStatus marketplace="cars" />
            </div>
          </div>
        </section>

        {/* Create Search Section */}
        <section className="py-12 bg-[#0A0A0A]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
              <div className="mb-6">
                <h2 className="text-2xl font-extrabold text-white mb-2 tracking-tight">
                  Create Search
                </h2>
                <p className="text-white/70 text-sm font-medium">
                  Your search will monitor the live market pool automatically.
                </p>
              </div>
              <div className="bg-[#121212] border border-white/10 rounded-xl p-6">
                <CarSearchForm
                  onSearchCreated={handleSearchCreated}
                  disabled={savedSearches.length >= 10}
                />
                {savedSearches.length >= 10 && (
                  <p className="text-xs text-white/60 mt-2">
                    Max 10 saved searches reached.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Saved Searches Section */}
        <section id="saved-searches" className="py-12 bg-[#0A0A0A]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <h2 className="text-2xl font-extrabold text-white mb-2 tracking-tight">
                  Your Searches
                </h2>
                <p className="text-white/70 text-sm font-medium">
                  Monitor performance and see what's working
                </p>
              </div>
              {!authLoading && !user && (
                <div className="mt-6 bg-[#121212] border border-white/10 rounded-xl p-6 text-center">
                  <p className="text-white/80 font-semibold">
                    Sign in to view your saved searches
                  </p>
                  <p className="text-white/60 text-sm mt-1">
                    Saving searches and enabling alerts requires an account.
                  </p>
                  <button
                    type="button"
                    className="mt-4 inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-extrabold bg-gradient-to-r from-[#00E5FF] to-[#7B2FFF] text-white"
                    onClick={() => openAuthModal("login")}
                  >
                    Sign in
                  </button>
                </div>
              )}
              {loadingSavedSearches && (
                <div className="space-y-4 mt-6">
                  {[...Array(2)].map((_, idx) => (
                    <div
                      key={idx}
                      className="bg-[#121212] border border-white/10 rounded-xl p-4 animate-pulse"
                    >
                      <div className="h-4 bg-white/10 rounded mb-2 w-3/4" />
                      <div className="h-3 bg-white/10 rounded mb-2 w-1/2" />
                      <div className="h-3 bg-white/10 rounded w-2/3" />
                    </div>
                  ))}
                </div>
              )}
              {!authLoading &&
                user &&
                !loadingSavedSearches &&
                savedSearches.length === 0 && (
                  <div className="mt-6 bg-[#121212] border border-white/10 rounded-xl p-6 text-center">
                    <p className="text-white/80 font-semibold">
                      No saved searches yet
                    </p>
                    <p className="text-white/60 text-sm mt-1">
                      Create a search above to start monitoring new deals
                      automatically.
                    </p>
                  </div>
                )}
              {user && savedSearches.length > 0 && (
                <div className="space-y-4 mt-6">
                  {savedSearches.map((search) => {
                    const isCarSearch = search.marketplace === "cars";
                    const facebookSummary = getSearchSummary(search.params);
                    const carSummary = getCarSearchSummary(search.params);
                    const hasMatches = search.dealCount > 0;
                    const matchLabel = hasMatches
                      ? `${search.dealCount} match${
                          search.dealCount === 1 ? "" : "es"
                        } found`
                      : "Monitoring";
                    const statusClasses = hasMatches
                      ? "bg-emerald-500/15 text-emerald-200 border border-emerald-400/40"
                      : "bg-white/5 text-white/80 border border-white/10";
                    const isSelected = selectedSearchId === search.id;

                    return (
	                      <motion.div
	                        key={search.id}
	                        className={`bg-[#121212] border rounded-xl p-4 cursor-pointer transition-colors ${
	                          isSelected
	                            ? "border-[#00E5FF]/40"
	                            : "border-white/10 hover:border-white/20"
                        }`}
                        initial={
                          motionPrefs.reducedMotion || !hydrated
                            ? false
                            : { opacity: 0, scale: 0.98 }
                        }
                        animate={
                          motionPrefs.reducedMotion ? undefined : { opacity: 1, scale: 1 }
                        }
	                        transition={
	                          motionPrefs.reducedMotion
	                            ? undefined
	                            : { ...MOTION_TRANSITION.fade, duration: motionSeverity.durationSec }
	                        }
	                        whileHover={
	                          motionPrefs.reducedMotion || !motionPrefs.canHover
	                            ? undefined
	                            : { y: -motionSeverity.hoverLiftPx }
	                        }
                        role="button"
                        tabIndex={0}
                        aria-expanded={isSelected}
                        onClick={() => {
                          if (isSelected) {
                            activeDealsRequestIdRef.current += 1;
                            setSelectedSearchId(null);
                            setDealFilters((prev) => ({ ...prev, searchIds: [] }));
                            setSelectedSearchDeals(null);
                            setSelectedSearchDealsError(null);
                            setLoadingSelectedSearchDeals(false);
                            return;
                          }
                          setSelectedSearchId(search.id);
                          if (search.marketplace === "cars") {
                            setDealFilters((prev) => ({ ...prev, searchIds: [search.id] }));
                          }
                          setSelectedSearchDeals(null);
                          setSelectedSearchDealsError(null);
                          loadDealsForSearch(search.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key !== "Enter" && e.key !== " ") return;
                          e.preventDefault();
                          if (isSelected) {
                            activeDealsRequestIdRef.current += 1;
                            setSelectedSearchId(null);
                            setDealFilters((prev) => ({ ...prev, searchIds: [] }));
                            setSelectedSearchDeals(null);
                            setSelectedSearchDealsError(null);
                            setLoadingSelectedSearchDeals(false);
                            return;
                          }
                          setSelectedSearchId(search.id);
                          if (search.marketplace === "cars") {
                            setDealFilters((prev) => ({ ...prev, searchIds: [search.id] }));
                          }
                          setSelectedSearchDeals(null);
                          setSelectedSearchDealsError(null);
                          loadDealsForSearch(search.id);
                        }}
                      >
                        <div className="flex items-start justify-between gap-3 text-sm text-white/70">
                          <div className="flex items-start gap-3">
                            <SavedSearchMosaic
                              images={search.previewImages}
                              alt={search.name || "Saved search"}
                              className="h-12 w-12 shrink-0"
                            />
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-white">
                                  {search.name || "Saved search"}
                                </span>
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full ${statusClasses}`}
                                >
                                  {matchLabel}
                                </span>
                              </div>
                              <div className="text-xs text-white/60">
                                {search.status === "paused"
                                  ? "Paused"
                                  : "Watching for new deals"}
                              </div>
                            </div>
                          </div>
                          <span className="text-xs text-white/50 whitespace-nowrap">
                            {timeAgo(search.createdAt, now)}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-3 text-xs">
                          <span className="px-2 py-1 bg-white/5 border border-white/10 rounded-full text-white/60">
                            Market:{" "}
                            {search.marketplace === "cars"
                              ? "Cars"
                              : search.marketplace === "facebook"
                              ? "Facebook"
                              : search.marketplace}
                          </span>
                          {isCarSearch ? (
                            <>
                              <span className="px-2 py-1 bg-white/5 border border-white/10 rounded-full text-white/80">
                                Vehicle: {carSummary.makeModel}
                              </span>
                              {carSummary.yearRange && (
                                <span className="px-2 py-1 bg-white/5 border border-white/10 rounded-full text-white/70">
                                  Year: {carSummary.yearRange}
                                </span>
                              )}
                              {typeof carSummary.maxPrice === "number" && (
                                <span className="px-2 py-1 bg-white/5 border border-white/10 rounded-full text-white/70">
                                  Max price:{" "}
                                  {carSummary.maxPrice.toLocaleString()}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="px-2 py-1 bg-white/5 border border-white/10 rounded-full text-white/80">
                              Keywords: {facebookSummary.keywords || "None"}
                            </span>
                          )}
                          {!isCarSearch && facebookSummary.location && (
                            <span className="px-2 py-1 bg-white/5 border border-white/10 rounded-full text-white/70">
                              Location: {facebookSummary.location}
                            </span>
                          )}
                          {!isCarSearch && facebookSummary.filters.length > 0 ? (
                            facebookSummary.filters.map((filter) => (
                              <span
                                key={`${search.id}-${filter}`}
                                className="px-2 py-1 bg-white/5 border border-white/10 rounded-full text-white/70"
                              >
                                {filter}
                              </span>
                            ))
                          ) : (
                            !isCarSearch && (
                              <span className="px-2 py-1 bg-white/5 border border-white/10 rounded-full text-white/60">
                                Filters: None
                              </span>
                            )
                          )}
                        </div>

                        {isSelected && (
                          <div
                            className="mt-4 pt-4 border-t border-white/10"
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                          >
                            {loadingSelectedSearchDeals && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {[...Array(3)].map((_, idx) => (
                                  <div
                                    key={idx}
                                    className="bg-[#0F0F0F] border border-white/10 rounded-lg p-3 animate-pulse"
                                  >
                                    <div className="h-3 bg-white/10 rounded mb-2 w-3/4" />
                                    <div className="h-3 bg-white/10 rounded mb-2 w-1/2" />
                                    <div className="h-3 bg-white/10 rounded w-2/3" />
                                  </div>
                                ))}
                              </div>
                            )}

                            {!loadingSelectedSearchDeals &&
                              selectedSearchDealsError && (
                                <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                                  {selectedSearchDealsError}
                                </div>
                              )}

                            {!loadingSelectedSearchDeals &&
                              !selectedSearchDealsError &&
                              Array.isArray(selectedSearchDeals) &&
                              selectedSearchDeals.length === 0 && (
                                <div className="text-sm text-white/70 bg-white/5 border border-white/10 rounded-lg p-4">
                                  {isCarSearch
                                    ? "No deals yet"
                                    : "No matches yet — still monitoring"}
                                </div>
                              )}

                            {!loadingSelectedSearchDeals &&
                              Array.isArray(selectedSearchDeals) &&
                              selectedSearchDeals.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {selectedSearchDeals.map((deal) => {
                                    const data = deal.data || deal.raw || {};
                                    const title =
                                      deal.title ||
                                      data?.title ||
                                      data?.name ||
                                      "Untitled";
                                    const currency =
                                      deal.currency || data?.currency || "$";
                                    const dealPrice = (deal.price ??
                                      data?.price?.amount ??
                                      data?.priceValue ??
                                      data?.price) as unknown;
                                    const rawPrice =
                                      typeof dealPrice === "number"
                                        ? dealPrice
                                        : typeof dealPrice === "string" &&
                                          dealPrice.trim() !== "" &&
                                          Number.isFinite(Number(dealPrice))
                                        ? Number(dealPrice)
                                        : null;
                                    const location =
                                      deal.location ||
                                      data?.location ||
                                      data?.city;
                                    const url =
                                      deal.url || data?.url || data?.link;
                                    const scoring = data?.scoring;
                                    const dealScore = parseNumericFilter(
                                      scoring?.dealScore ?? scoring?.breakdown?.DealScore
                                    );
                                    const scoreLabel =
                                      typeof scoring?.breakdown?.Interpretation ===
                                        "string" &&
                                      scoring.breakdown.Interpretation.length > 0
                                        ? scoring.breakdown.Interpretation
                                        : dealScore !== null
                                        ? dealScore >= 80
                                          ? "Strong Flip"
                                          : dealScore >= 65
                                          ? "Worth Inspecting"
                                          : dealScore >= 50
                                          ? "Speculative"
                                          : "Avoid"
                                        : null;
                                    const scoreClasses =
                                      dealScore === null
                                        ? "bg-white/5 text-white/70 border border-white/10"
                                        : dealScore >= 80
                                        ? "bg-emerald-500/15 text-emerald-200 border border-emerald-400/40"
                                        : dealScore >= 65
                                        ? "bg-sky-500/15 text-sky-200 border border-sky-400/40"
                                        : dealScore >= 50
                                        ? "bg-amber-500/15 text-amber-200 border border-amber-400/40"
                                        : "bg-red-500/15 text-red-200 border border-red-400/40";

                                    return (
                                      <div
                                        key={deal.id}
                                        className="bg-[#0F0F0F] border border-white/10 rounded-lg p-3 hover:border-white/20 transition-colors"
                                      >
                                        <div className="text-sm font-semibold text-white line-clamp-2">
                                          {title}
                                        </div>
                                        {isCarSearch && dealScore !== null && (
                                          <div className="mt-2">
                                            <span
                                              className={`inline-flex items-center gap-2 px-2 py-0.5 text-[11px] font-semibold rounded-full ${scoreClasses}`}
                                            >
                                              DealScore {dealScore}
                                              {scoreLabel ? `• ${scoreLabel}` : ""}
                                            </span>
                                          </div>
                                        )}
                                        <div className="flex items-center justify-between mt-2 text-xs text-white/70">
                                          <span className="font-semibold text-[#00E5FF]">
                                            {rawPrice !== null
                                              ? `${currency}${rawPrice.toLocaleString()}`
                                              : "—"}
                                          </span>
                                          <span className="text-white/50">
                                            {deal.created_at
                                              ? timeAgo(
                                                  new Date(deal.created_at).getTime(),
                                                  now
                                                )
                                              : ""}
                                          </span>
                                        </div>
                                        {isCarSearch ? (
                                          <>
                                            <div className="text-xs text-white/60 mt-1 line-clamp-1">
                                              {[
                                                (() => {
                                                  const year = parseNumericFilter(
                                                    data?.year
                                                  );
                                                  return typeof year ===
                                                    "number"
                                                    ? `Year: ${year}`
                                                    : null;
                                                })(),
                                                (() => {
                                                  const mileage = parseNumericFilter(
                                                    data?.mileage ??
                                                      data?.odometer ??
                                                      data?.miles
                                                  );
                                                  return typeof mileage ===
                                                    "number"
                                                    ? `Mileage: ${mileage.toLocaleString()}`
                                                    : null;
                                                })(),
                                              ]
                                                .filter(Boolean)
                                                .join(" • ") ||
                                                "Car details unavailable"}
                                            </div>
                                            <div className="text-xs text-white/60 mt-1 line-clamp-1">
                                              {location || "Unknown location"}
                                            </div>
                                            {dealScore !== null &&
                                              scoring?.breakdown && (
                                                <details className="mt-3 text-xs text-white/70">
                                                  <summary className="cursor-pointer select-none font-semibold text-white/80">
                                                    Why this is a good deal
                                                  </summary>
                                                  <ul className="mt-2 space-y-1 list-disc list-inside text-white/60">
                                                    <li>
                                                      Margin:{" "}
                                                      {(() => {
                                                        const margin = parseNumericFilter(
                                                          scoring.breakdown?.BaseMarginScore
                                                        );
                                                        if (margin === null)
                                                          return "Not enough data yet";
                                                        if (margin >= 30)
                                                          return "Strong margin vs estimated resale";
                                                        if (margin >= 15)
                                                          return "Some margin potential—verify resale";
                                                        return "Thin margin—verify comps";
                                                      })()}
                                                    </li>
                                                    <li>
                                                      Demand:{" "}
                                                      {(() => {
                                                        const demand = parseNumericFilter(
                                                          scoring.breakdown?.DemandScore
                                                        );
                                                        if (demand === null)
                                                          return "Not enough data yet";
                                                        if (demand >= 14)
                                                          return "High demand indicators";
                                                        if (demand >= 7)
                                                          return "Moderate demand indicators";
                                                        return "Demand signals unclear";
                                                      })()}
                                                    </li>
                                                    <li>
                                                      Condition:{" "}
                                                      {(() => {
                                                        const condition = parseNumericFilter(
                                                          scoring.breakdown?.ConditionMismatchScore
                                                        );
                                                        if (condition === null)
                                                          return "Not enough data yet";
                                                        if (condition >= 16)
                                                          return "Mileage/year profile looks favorable";
                                                        if (condition >= 10)
                                                          return "Mileage/year profile looks typical";
                                                        return "Mileage looks heavy for age";
                                                      })()}
                                                    </li>
                                                    <li>
                                                      Risk:{" "}
                                                      {(() => {
                                                        const risk = parseNumericFilter(
                                                          scoring.breakdown?.RepairRiskPenalty
                                                        );
                                                        const sellerType =
                                                          typeof scoring?.sellerType ===
                                                            "string" &&
                                                          scoring.sellerType.length > 0
                                                            ? scoring.sellerType
                                                            : null;
                                                        const sellerNote =
                                                          sellerType === "dealer"
                                                            ? " (dealer listing)"
                                                            : sellerType === "unknown"
                                                            ? " (seller unknown)"
                                                            : "";
                                                        if (risk === null)
                                                          return `Not enough data yet${sellerNote}`;
                                                        if (risk >= 15)
                                                          return `High risk signals—inspect carefully${sellerNote}`;
                                                        if (risk >= 8)
                                                          return `Some risk signals—inspect carefully${sellerNote}`;
                                                        return `Low risk signals based on listing text${sellerNote}`;
                                                      })()}
                                                    </li>
                                                  </ul>
                                                </details>
                                              )}
                                          </>
                                        ) : (
                                          <div className="text-xs text-white/60 mt-1 line-clamp-1">
                                            {location || "Unknown location"}
                                          </div>
                                        )}
                                        {url && (
                                          <a
                                            href={url}
                                            target="_blank"
                                            rel="noreferrer noopener"
                                            className="inline-flex mt-3 text-xs font-semibold text-white/80 hover:text-white underline"
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            View listing
                                          </a>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Live Deals Section */}
        <section className="py-12 bg-[#0A0A0A]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-extrabold text-white mb-2 tracking-tight">
                    Live Deals
                  </h2>
                  <p className="text-white/70 text-sm font-medium">
                    Real-time opportunities from the pooled car market
                  </p>
                </div>
                <button
                  type="button"
                  className="md:hidden inline-flex items-center justify-center rounded-lg px-3 py-2 text-xs font-extrabold bg-white/5 border border-white/10 text-white/80 hover:text-white hover:border-white/20"
                  onClick={() => setDealFiltersOpen(true)}
                >
                  Filters
                </button>
              </div>
            </div>

            <DealsFilterModal
              open={dealFiltersOpen}
              onOpenChange={setDealFiltersOpen}
              marketplaceSlug="cars"
              searches={savedSearches.map((s) => ({
                id: s.id,
                name: s.name,
                marketplace: s.marketplace,
              }))}
              value={dealFilters}
              onChange={setDealFilters}
            />

            <CarDealsGrid
              marketplaceSlug="cars"
              limit={20}
              searchIds={dealFilters.searchIds}
              minPrice={dealFilters.minPrice}
              maxPrice={dealFilters.maxPrice}
              hideDealers={dealFilters.hideDealers}
              hideSpam={dealFilters.hideSpam}
            />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
