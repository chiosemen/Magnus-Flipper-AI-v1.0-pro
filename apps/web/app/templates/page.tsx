"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import Header from "../../marketing-swoopa/components/Header";
import Footer from "../../marketing-swoopa/components/Footer";
import { useAuth } from "@/providers/AuthProvider";
import { useRegion } from "@/providers/RegionProvider";
import { SavedSearchMosaic } from "../../components/SavedSearchMosaic";
import { getSupportedMarketplacesForRegion } from "@magnus-flipper-ai/marketplace-config";

type TemplateRow = {
  id: string;
  category: string;
  title: string;
  marketplace: string;
  params_json: Record<string, any>;
  tags: string[] | null;
  region: string;
  created_at: string;
};

type DealRow = {
  id: string;
  title: string | null;
  primary_image: string | null;
  images: any;
  url: string | null;
};

function safeUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function imageFromDeal(deal: DealRow): string | null {
  const direct = safeUrl(deal?.primary_image);
  if (direct) return direct;

  const images = Array.isArray((deal as any)?.images) ? (deal as any).images : [];
  const first = images
    .map((img: any) => safeUrl(img?.url ?? img))
    .find((url: any) => typeof url === "string" && url.length > 0);
  return first ?? null;
}

export default function TemplatesPage() {
  const router = useRouter();
  const { user, openAuthModal } = useAuth();
  const { region, setRegion } = useRegion();

  const [marketplace, setMarketplace] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<TemplateRow[]>([]);

  const [previewOpen, setPreviewOpen] = useState<Record<string, boolean>>({});
  const [previewDeals, setPreviewDeals] = useState<Record<string, DealRow[]>>({});
  const [previewLoading, setPreviewLoading] = useState<Record<string, boolean>>({});

  const regionFilter = useMemo(() => region, [region]);
  const marketplaceOptions = useMemo(() => {
    const includeOptional = process.env.NEXT_PUBLIC_ENABLE_SHPOCK === "true";
    return getSupportedMarketplacesForRegion(regionFilter, { includeOptional });
  }, [regionFilter]);

  useEffect(() => {
    if (marketplace !== "all" && !marketplaceOptions.includes(marketplace)) {
      setMarketplace("all");
    }
  }, [marketplace, marketplaceOptions]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (marketplace !== "all") params.set("marketplace", marketplace);
        if (category !== "all") params.set("category", category);
        params.set("region", regionFilter);
        params.set("limit", "50");

        const res = await fetch(`/api/templates?${params.toString()}`);
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload?.error || "Failed to load templates");
        }
        const payload = await res.json();
        const rows = Array.isArray(payload?.templates) ? (payload.templates as TemplateRow[]) : [];
        if (!cancelled) setTemplates(rows);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Failed to load templates");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [marketplace, category, regionFilter]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const t of templates) {
      if (typeof t.category === "string" && t.category.trim()) set.add(t.category.trim());
    }
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [templates]);

  const handleInstall = async (template: TemplateRow) => {
    if (!user) {
      openAuthModal("login");
      return;
    }

    const res = await fetch(`/api/templates/install?region=${encodeURIComponent(regionFilter)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ templateId: template.id }),
    });

    if (res.status === 401) {
      openAuthModal("login");
      return;
    }

    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      throw new Error(payload?.error || "Failed to install template");
    }

    // After install, take the user to the relevant marketplace page (search will appear in "Your Searches").
    const target = template.marketplace === "cars" ? "/marketplaces/cars#saved-searches" : `/marketplaces/${template.marketplace}#saved-searches`;
    router.push(target);
  };

  const togglePreview = async (template: TemplateRow) => {
    const isOpen = Boolean(previewOpen[template.id]);
    const next = { ...previewOpen, [template.id]: !isOpen };
    setPreviewOpen(next);

    if (isOpen) return;
    if (previewDeals[template.id]) return;

    setPreviewLoading((prev) => ({ ...prev, [template.id]: true }));
    try {
      const res = await fetch(`/api/templates/${template.id}/preview?limit=8`);
      const payload = await res.json().catch(() => ({}));
      const deals = Array.isArray(payload?.deals) ? (payload.deals as DealRow[]) : [];
      setPreviewDeals((prev) => ({ ...prev, [template.id]: deals }));
    } finally {
      setPreviewLoading((prev) => ({ ...prev, [template.id]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Header />
      <main>
        <section className="relative pt-32 pb-10 overflow-hidden bg-[#0A0A0A]">
          <div className="absolute inset-0 gradient-hero" />
          <div className="absolute top-1/2 left-1/4 w-[600px] h-[600px] bg-gradient-to-br from-[#00E5FF]/40 to-[#7B2FFF]/40 blur-3xl opacity-30 -translate-y-1/2" />

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-4xl mx-auto">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm font-medium mb-8 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to home
              </Link>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-[#00E5FF]/20 to-[#7B2FFF]/20 rounded-2xl flex items-center justify-center border border-[#00E5FF]/30">
                  <Sparkles className="w-8 h-8 text-[#00E5FF]" />
                </div>
                <div>
                  <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-2 tracking-tight">
                    Winning Templates
                  </h1>
                  <p className="text-white/80 text-lg font-medium">
                    Proven searches you can install in one click.
                  </p>
                </div>
              </div>
            </div>

            <div className="max-w-4xl mx-auto mt-8 bg-[#121212] border border-white/10 rounded-xl p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="text-xs font-semibold text-white/70">
                  Region
                  <select
                    className="mt-1 w-full rounded-lg bg-[#0F0F0F] border border-white/10 px-3 py-2 text-sm text-white"
                    value={regionFilter}
                    onChange={(e) => setRegion(e.target.value === "UK" ? "UK" : "US")}
                  >
                    <option value="UK">UK</option>
                    <option value="US">US</option>
                  </select>
                </label>

                <label className="text-xs font-semibold text-white/70">
                  Marketplace
                  <select
                    className="mt-1 w-full rounded-lg bg-[#0F0F0F] border border-white/10 px-3 py-2 text-sm text-white"
                    value={marketplace}
                    onChange={(e) => setMarketplace(e.target.value)}
                  >
                    <option value="all">All</option>
                    {marketplaceOptions.map((m) => (
                      <option key={m} value={m}>
                        {m === "cars" ? "Cars" : m.charAt(0).toUpperCase() + m.slice(1)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-xs font-semibold text-white/70">
                  Category
                  <select
                    className="mt-1 w-full rounded-lg bg-[#0F0F0F] border border-white/10 px-3 py-2 text-sm text-white"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c === "all" ? "All" : c}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="mt-3 text-[11px] text-white/55">
                Templates include anti-keywords to reduce spam matches. Install one to create a saved search.
              </div>
            </div>
          </div>
        </section>

        <section className="py-10 bg-[#0A0A0A]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              {error && (
                <div className="bg-[#121212] border border-red-400/30 rounded-xl p-4 text-sm text-red-200">
                  {error}
                </div>
              )}

              {loading ? (
                <div className="text-white/70 text-sm font-medium">Loading templates…</div>
              ) : templates.length === 0 ? (
                <div className="bg-[#121212] border border-white/10 rounded-xl p-6 text-center">
                  <div className="text-white font-extrabold">No templates found</div>
                  <div className="text-white/60 text-sm mt-1">
                    Try switching region or marketplace filters.
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {templates.map((t) => {
                    const isPreviewOpen = Boolean(previewOpen[t.id]);
                    const deals = previewDeals[t.id] ?? [];
                    const images = deals
                      .map((d) => imageFromDeal(d))
                      .filter((v): v is string => typeof v === "string" && v.length > 0)
                      .slice(0, 4);
                    const loadingPreview = Boolean(previewLoading[t.id]);

                    return (
                      <div
                        key={t.id}
                        className="bg-[#121212] border border-white/10 rounded-xl p-5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="text-white font-extrabold tracking-tight">
                              {t.title}
                            </div>
                            <div className="text-xs text-white/60 mt-1 flex flex-wrap gap-2">
                              <span className="px-2 py-1 bg-white/5 border border-white/10 rounded-full">
                                {t.marketplace}
                              </span>
                              <span className="px-2 py-1 bg-white/5 border border-white/10 rounded-full">
                                {t.region}
                              </span>
                              <span className="px-2 py-1 bg-white/5 border border-white/10 rounded-full">
                                {t.category}
                              </span>
                              {(t.tags ?? []).slice(0, 4).map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2 py-1 bg-white/5 border border-white/10 rounded-full text-white/70"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                            <button
                              type="button"
                              className="inline-flex items-center justify-center rounded-lg px-3 py-2 text-xs font-extrabold bg-gradient-to-r from-[#00E5FF] to-[#7B2FFF] text-white"
                              onClick={() => {
                                handleInstall(t).catch((err) => {
                                  setError(err?.message || "Failed to install template");
                                });
                              }}
                            >
                              Use template
                            </button>
                            <button
                              type="button"
                              className="inline-flex items-center justify-center rounded-lg px-3 py-2 text-xs font-extrabold bg-[#0F0F0F] text-white/80 border border-white/10 hover:border-[#00E5FF]/50"
                              onClick={() => togglePreview(t)}
                            >
                              {isPreviewOpen ? "Hide preview" : "Preview"}
                            </button>
                          </div>
                        </div>

                        {isPreviewOpen && (
                          <div className="mt-4">
                            {loadingPreview ? (
                              <div className="text-xs text-white/60">Loading preview…</div>
                            ) : deals.length === 0 ? (
                              <div className="flex items-center gap-3 text-xs text-white/60">
                                <SavedSearchMosaic images={[]} alt="No preview deals" className="h-12 w-12" />
                                <div>No matching pooled deals yet.</div>
                              </div>
                            ) : (
                              <div className="flex items-start gap-3">
                                <SavedSearchMosaic
                                  images={images}
                                  alt={t.title}
                                  className="h-14 w-14"
                                />
                                <div className="min-w-0">
                                  <div className="text-xs text-white/70 font-semibold">
                                    Example deals from the pool
                                  </div>
                                  <div className="text-[11px] text-white/55 mt-1">
                                    Preview uses pooled data only — installing does not trigger scraping.
                                  </div>
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {deals.slice(0, 4).map((d) => (
                                      <a
                                        key={d.id}
                                        href={d.url ?? "#"}
                                        target="_blank"
                                        rel="noreferrer noopener"
                                        className="text-[11px] text-[#00E5FF] hover:underline truncate max-w-[280px]"
                                      >
                                        {d.title ?? "Deal"}
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
