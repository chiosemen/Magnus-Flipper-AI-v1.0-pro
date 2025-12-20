"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "../../../marketing-swoopa/components/Header";
import Footer from "../../../marketing-swoopa/components/Footer";
import { useAuth } from "@/providers/AuthProvider";
import { useRegion } from "@/providers/RegionProvider";
import type { SavedSearchRow } from "../../../lib/supabase/types";

type NotificationSettings = {
  user_id: string;
  push_enabled: boolean;
  email_enabled: boolean;
  quiet_hours_start_minute: number | null;
  quiet_hours_end_minute: number | null;
  quiet_hours_timezone: string | null;
  per_search: Record<string, any>;
  push_subscriptions: any[];
  updated_at: string | null;
};

function minuteToTime(value: number | null): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "";
  const mins = Math.max(0, Math.min(1439, Math.floor(value)));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function timeToMinute(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function fetchJSON(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any)?.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export default function NotificationsSettingsPage() {
  const { user, loading: authLoading, openAuthModal } = useAuth();
  const { region } = useRegion();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [searches, setSearches] = useState<SavedSearchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tzDefault = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      return "UTC";
    }
  }, []);

  const pushPermission = useMemo(() => {
    if (typeof window === "undefined") return "unsupported";
    if (!("Notification" in window)) return "unsupported";
    return Notification.permission;
  }, [settings?.updated_at]);

  useEffect(() => {
    (async () => {
      if (authLoading) return;
      if (!user) {
        setSettings(null);
        setSearches([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const [settingsRes, searchesRes] = await Promise.all([
          fetchJSON("/api/notifications/settings"),
          fetchJSON(`/api/searches?region=${encodeURIComponent(region)}`).catch(() => ({ searches: [] })),
        ]);
        setSettings(settingsRes.settings as NotificationSettings);
        setSearches(Array.isArray(searchesRes?.searches) ? (searchesRes.searches as SavedSearchRow[]) : []);
      } catch (err: any) {
        setError(err?.message || "Failed to load settings");
      } finally {
        setLoading(false);
      }
    })();
  }, [authLoading, user?.id, region]);

  const updateSettings = async (patch: any) => {
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetchJSON("/api/notifications/settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      });
      setSettings(res.settings as NotificationSettings);
    } catch (err: any) {
      setError(err?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const subscribePush = async () => {
    if (!user) return;
    setError(null);

    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("Notification" in window)) {
      setError("Push notifications are not supported in this browser.");
      return;
    }

    if (Notification.permission === "denied") {
      setError("Push permission is blocked in your browser settings.");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setError("Push permission not granted.");
      return;
    }

    const { publicKey } = await fetchJSON("/api/notifications/vapid-public-key");
    const registration = await navigator.serviceWorker.register("/push-sw.js");
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    await fetchJSON("/api/notifications/push/subscribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(sub),
    });

    // Refresh settings view.
    const refreshed = await fetchJSON("/api/notifications/settings");
    setSettings(refreshed.settings as NotificationSettings);
  };

  const unsubscribePush = async () => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    setError(null);

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return;
      const sub = await registration.pushManager.getSubscription();
      if (!sub) return;
      const endpoint = sub.endpoint;
      await sub.unsubscribe();
      await fetchJSON("/api/notifications/push/unsubscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ endpoint }),
      });

      const refreshed = await fetchJSON("/api/notifications/settings");
      setSettings(refreshed.settings as NotificationSettings);
    } catch (err: any) {
      setError(err?.message || "Failed to unsubscribe");
    }
  };

  const togglePerSearch = async (searchId: string, enabled: boolean) => {
    const current = settings?.per_search && typeof settings.per_search === "object" ? settings.per_search : {};
    const next = { ...current, [searchId]: { enabled } };
    await updateSettings({ perSearch: next });
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <Header />
      <main className="pt-28 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Notifications
            </h1>
            <p className="mt-2 text-white/70 text-sm font-medium">
              Enable instant alerts via push (recommended) with email fallback.
            </p>

            {!authLoading && !user && (
              <div className="mt-8 bg-[#121212] border border-white/10 rounded-xl p-6 text-center">
                <p className="text-white/80 font-semibold">
                  Sign in to manage notifications
                </p>
                <p className="text-white/60 text-sm mt-1">
                  Alerts are tied to your saved searches and subscription tier.
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

            {user && (
              <div className="mt-8 space-y-6">
                {error && (
                  <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">
                    {error}
                  </div>
                )}

                <div className="bg-[#121212] border border-white/10 rounded-xl p-6">
                  <h2 className="text-lg font-extrabold text-white">Channels</h2>
                  <div className="mt-4 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold text-white">
                          Push notifications
                        </div>
                        <div className="text-xs text-white/60 mt-1">
                          Permission:{" "}
                          <span className="text-white/80">
                            {pushPermission}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="rounded-lg px-3 py-2 text-xs font-extrabold bg-white/5 border border-white/10 text-white hover:border-white/20 disabled:opacity-50"
                          disabled={loading || saving}
                          onClick={() => updateSettings({ pushEnabled: !(settings?.push_enabled ?? false) })}
                        >
                          {settings?.push_enabled ? "On" : "Off"}
                        </button>
                        <button
                          type="button"
                          className="rounded-lg px-3 py-2 text-xs font-extrabold bg-gradient-to-r from-[#00E5FF] to-[#7B2FFF] text-white disabled:opacity-50"
                          disabled={loading || saving}
                          onClick={subscribePush}
                        >
                          Enable push
                        </button>
                        <button
                          type="button"
                          className="rounded-lg px-3 py-2 text-xs font-extrabold bg-white/5 border border-white/10 text-white hover:border-white/20 disabled:opacity-50"
                          disabled={loading || saving}
                          onClick={unsubscribePush}
                        >
                          Disable device
                        </button>
                      </div>
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold text-white">
                          Email fallback
                        </div>
                        <div className="text-xs text-white/60 mt-1">
                          Used when push is not available.
                        </div>
                      </div>
                      <button
                        type="button"
                        className="rounded-lg px-3 py-2 text-xs font-extrabold bg-white/5 border border-white/10 text-white hover:border-white/20 disabled:opacity-50"
                        disabled={loading || saving}
                        onClick={() => updateSettings({ emailEnabled: !(settings?.email_enabled ?? true) })}
                      >
                        {settings?.email_enabled ? "On" : "Off"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-[#121212] border border-white/10 rounded-xl p-6">
                  <h2 className="text-lg font-extrabold text-white">Quiet hours</h2>
                  <p className="mt-1 text-xs text-white/60">
                    Suppress notifications during a time window (no delayed delivery in v1).
                  </p>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-white/80">Start</label>
                      <input
                        type="time"
                        value={minuteToTime(settings?.quiet_hours_start_minute ?? null)}
                        onChange={(e) =>
                          updateSettings({
                            quietHours: {
                              startMinute: timeToMinute(e.target.value),
                              endMinute: settings?.quiet_hours_end_minute ?? null,
                              timezone: settings?.quiet_hours_timezone ?? tzDefault,
                            },
                          })
                        }
                        className="mt-1 w-full rounded-lg bg-[#0A0A0A] border border-white/10 px-3 py-2 text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-white/80">End</label>
                      <input
                        type="time"
                        value={minuteToTime(settings?.quiet_hours_end_minute ?? null)}
                        onChange={(e) =>
                          updateSettings({
                            quietHours: {
                              startMinute: settings?.quiet_hours_start_minute ?? null,
                              endMinute: timeToMinute(e.target.value),
                              timezone: settings?.quiet_hours_timezone ?? tzDefault,
                            },
                          })
                        }
                        className="mt-1 w-full rounded-lg bg-[#0A0A0A] border border-white/10 px-3 py-2 text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-white/80">Timezone</label>
                      <input
                        value={settings?.quiet_hours_timezone ?? tzDefault}
                        onChange={(e) =>
                          updateSettings({
                            quietHours: {
                              startMinute: settings?.quiet_hours_start_minute ?? null,
                              endMinute: settings?.quiet_hours_end_minute ?? null,
                              timezone: e.target.value,
                            },
                          })
                        }
                        className="mt-1 w-full rounded-lg bg-[#0A0A0A] border border-white/10 px-3 py-2 text-white text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-[#121212] border border-white/10 rounded-xl p-6">
                  <h2 className="text-lg font-extrabold text-white">Per-search toggles</h2>
                  <p className="mt-1 text-xs text-white/60">
                    Control which saved searches can trigger alerts.
                  </p>
                  <div className="mt-4 space-y-3">
                    {searches.length === 0 && (
                      <div className="text-sm text-white/60">
                        No saved searches found.
                      </div>
                    )}
                    {searches.map((s) => {
                      const enabled =
                        typeof (settings?.per_search as any)?.[s.id]?.enabled === "boolean"
                          ? Boolean((settings?.per_search as any)[s.id].enabled)
                          : true;
                      const name =
                        (typeof (s as any)?.name === "string" && (s as any).name) ||
                        (typeof (s as any)?.params?.query === "string" && (s as any).params.query) ||
                        "Saved search";
                      return (
                        <div
                          key={s.id}
                          className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-black/20 px-4 py-3"
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-white truncate">
                              {name}
                            </div>
                            <div className="text-xs text-white/50 truncate">
                              {s.marketplace}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="rounded-lg px-3 py-2 text-xs font-extrabold bg-white/5 border border-white/10 text-white hover:border-white/20 disabled:opacity-50"
                            disabled={loading || saving}
                            onClick={() => togglePerSearch(s.id, !enabled)}
                          >
                            {enabled ? "On" : "Off"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="text-xs text-white/50">
                  Alerts are tier-gated and never trigger scraping.
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
