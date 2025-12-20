import { Worker } from "bullmq";
import type { SupabaseClient } from "@supabase/supabase-js";
import { redis, type AlertDispatchJob } from "@magnus-flipper-ai/queue";
import { dealMatchesSavedSearch } from "@magnus-flipper-ai/deal-matching";
import { getAlertThresholds } from "@magnus-flipper-ai/alerts";
import webpush from "web-push";
import { getSupabase } from "../services/supabase";

type PricingTier = "FREE_BASIC" | "STARTER" | "PRO" | "ELITE";

type DealRow = {
  id: string;
  region: string | null;
  marketplace: string;
  listing_id: string | null;
  title: string | null;
  price: number | string | null;
  location: string | null;
  url: string | null;
  score: number | string | null;
  primary_image: string | null;
  images: any;
  attributes: any;
  created_at: string | null;
  fetched_at: string | null;
  posted_at: string | null;
};

type SavedSearchRow = {
  id: string;
  user_id: string | null;
  region: string | null;
  marketplace: string | null;
  params: any;
  status: string | null;
};

type NotificationSettingsRow = {
  user_id: string;
  push_enabled: boolean;
  email_enabled: boolean;
  quiet_hours_start_minute: number | null;
  quiet_hours_end_minute: number | null;
  quiet_hours_timezone: string | null;
  per_search: any;
  push_subscriptions: any;
};

type SubscriptionRow = {
  user_id: string;
  status: string | null;
  plan: string | null;
  tier: string | null;
  is_active: boolean | null;
};

function safeNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  }
  return null;
}

function safeText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseTimestampMs(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value instanceof Date) {
    const ms = value.getTime();
    return Number.isFinite(ms) ? ms : null;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const ms = Date.parse(value);
    return Number.isFinite(ms) ? ms : null;
  }
  return null;
}

function normalizePricingTier(input: unknown): PricingTier {
  if (typeof input !== "string") return "FREE_BASIC";
  const value = input.trim().toLowerCase();
  if (!value) return "FREE_BASIC";

  if (value === "free" || value === "basic" || value === "free/basic" || value === "free_basic") {
    return "FREE_BASIC";
  }
  if (value === "starter") return "STARTER";
  if (value === "pro" || value === "premium") return "PRO";
  if (value === "elite" || value === "agency" || value === "ultra" || value === "admin") return "ELITE";

  if (value.includes("starter")) return "STARTER";
  if (value.includes("elite") || value.includes("agency") || value.includes("ultra")) return "ELITE";
  if (value.includes("pro") || value.includes("premium")) return "PRO";
  if (value.includes("free") || value.includes("basic")) return "FREE_BASIC";

  return "FREE_BASIC";
}

function normalizeDealRegion(value: unknown): "US" | "UK" {
  const raw = safeText(value)?.toUpperCase();
  return raw === "UK" || raw === "GB" ? "UK" : "US";
}

function applyMileageModifier(score: number, mileage: number | null): number {
  if (mileage === null) return score;
  if (mileage < 100_000) return score + 5;
  if (mileage > 180_000) return score - 5;
  return score;
}

function ageMinutesFromDeal(deal: DealRow): number | null {
  const tsMs =
    parseTimestampMs(deal.posted_at) ??
    parseTimestampMs(deal.fetched_at) ??
    parseTimestampMs(deal.created_at) ??
    null;
  if (tsMs === null) return null;
  const diffMs = Date.now() - tsMs;
  if (!Number.isFinite(diffMs) || diffMs < 0) return null;
  return diffMs / 60_000;
}

function extractCarMileage(deal: DealRow): number | null {
  const attrs = deal.attributes && typeof deal.attributes === "object" ? (deal.attributes as any) : {};
  const mileage = safeNumber(attrs?.mileage);
  return mileage !== null ? mileage : null;
}

function isCarDeal(deal: DealRow): boolean {
  const attrs = deal.attributes && typeof deal.attributes === "object" ? (deal.attributes as any) : {};
  const category = safeText(attrs?.category)?.toLowerCase();
  return deal.marketplace?.toLowerCase?.() === "cars" || category === "car" || category === "cars";
}

function pushConfigured(): boolean {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

function configureWebPushOnce() {
  if (!pushConfigured()) return;
  const subject = process.env.VAPID_SUBJECT || "mailto:alerts@magnusflipper.ai";
  webpush.setVapidDetails(subject, process.env.VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!);
}

function parsePushSubscriptions(value: unknown): any[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((sub) => (sub && typeof sub === "object" ? sub : null))
    .filter(Boolean) as any[];
}

function isWithinQuietHours(settings: NotificationSettingsRow | null): boolean {
  const start = settings?.quiet_hours_start_minute ?? null;
  const end = settings?.quiet_hours_end_minute ?? null;
  const tz = safeText(settings?.quiet_hours_timezone) ?? "UTC";
  if (start === null || end === null) return false;

  const startMin = Math.max(0, Math.min(24 * 60 - 1, Math.floor(start)));
  const endMin = Math.max(0, Math.min(24 * 60 - 1, Math.floor(end)));

  // If start == end, treat as disabled.
  if (startMin === endMin) return false;

  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .formatToParts(now)
    .reduce<Record<string, string>>((acc, part) => {
      if (part.type !== "literal") acc[part.type] = part.value;
      return acc;
    }, {});

  const hour = safeNumber(parts.hour) ?? null;
  const minute = safeNumber(parts.minute) ?? null;
  if (hour === null || minute === null) return false;

  const nowMin = Math.floor(hour) * 60 + Math.floor(minute);

  // Range can wrap over midnight.
  if (startMin < endMin) {
    return nowMin >= startMin && nowMin < endMin;
  }
  return nowMin >= startMin || nowMin < endMin;
}

function perSearchEnabled(settings: NotificationSettingsRow | null, searchId: string): boolean {
  const perSearch = settings?.per_search;
  if (!perSearch || typeof perSearch !== "object") return true;
  const entry = (perSearch as any)[searchId];
  if (!entry) return true;
  if (typeof entry === "boolean") return entry;
  if (typeof entry?.enabled === "boolean") return entry.enabled;
  return true;
}

function buildCooldownKey({
  userId,
  marketplace,
  listingId,
}: {
  userId: string;
  marketplace: string;
  listingId: string;
}): string {
  const cooldownMinutes = Math.max(
    5,
    Number.parseInt(process.env.ALERT_DEDUPE_COOLDOWN_MINUTES || "360", 10) || 360
  );
  const bucket = Math.floor(Date.now() / (cooldownMinutes * 60_000));
  return `${userId}:${marketplace}:${listingId}:${bucket}`;
}

async function loadDealByListingId(supabase: SupabaseClient, marketplace: string, listingId: string): Promise<DealRow | null> {
  const { data, error } = await supabase
    .from("deals")
    .select(
      "id, region, marketplace, listing_id, title, price, location, url, score, primary_image, images, attributes, created_at, fetched_at, posted_at, search_id"
    )
    .eq("marketplace", marketplace)
    .eq("listing_id", listingId)
    .is("search_id", null)
    .maybeSingle();

  if (error) {
    console.error("[user-alert-dispatch] deals lookup failed", { marketplace, listingId, error });
    return null;
  }

  return (data as any) as DealRow | null;
}

async function loadActiveSearchesForMarketplace(
  supabase: SupabaseClient,
  marketplace: string,
  region: "US" | "UK"
): Promise<SavedSearchRow[]> {
  const { data, error } = await supabase
    .from("saved_searches")
    .select("id, user_id, region, marketplace, params, status")
    .eq("status", "active")
    .eq("marketplace", marketplace)
    .eq("region", region)
    .not("user_id", "is", null);

  if (error) {
    console.error("[user-alert-dispatch] saved_searches lookup failed", { marketplace, error });
    return [];
  }

  return (Array.isArray(data) ? data : []) as any;
}

async function loadNotificationSettingsByUser(
  supabase: SupabaseClient,
  userIds: string[]
): Promise<Map<string, NotificationSettingsRow>> {
  if (userIds.length === 0) return new Map();
  const { data, error } = await supabase
    .from("user_notification_settings")
    .select(
      "user_id, push_enabled, email_enabled, quiet_hours_start_minute, quiet_hours_end_minute, quiet_hours_timezone, per_search, push_subscriptions"
    )
    .in("user_id", userIds);

  if (error) {
    console.error("[user-alert-dispatch] notification settings lookup failed", error);
    return new Map();
  }

  const map = new Map<string, NotificationSettingsRow>();
  for (const row of Array.isArray(data) ? (data as any[]) : []) {
    if (typeof row?.user_id === "string") map.set(row.user_id, row as any);
  }
  return map;
}

async function loadSubscriptionTiers(
  supabase: SupabaseClient,
  userIds: string[]
): Promise<Map<string, PricingTier>> {
  const map = new Map<string, PricingTier>();
  if (userIds.length === 0) return map;

  const { data, error } = await supabase
    .from("subscriptions")
    .select("user_id, status, plan, tier, is_active")
    .in("user_id", userIds);

  if (error) {
    // If subscriptions table is missing, fail closed to FREE_BASIC.
    console.warn("[user-alert-dispatch] subscription lookup failed; defaulting tiers to FREE_BASIC", error);
    return map;
  }

  for (const row of Array.isArray(data) ? (data as any[]) : []) {
    const userId = safeText(row?.user_id);
    if (!userId) continue;
    const status = safeText(row?.status)?.toLowerCase() ?? "";
    const isActive =
      Boolean(row?.is_active) || status === "active" || status === "trialing";
    const rawTier = row?.tier ?? row?.plan ?? null;
    map.set(userId, isActive ? normalizePricingTier(rawTier) : "FREE_BASIC");
  }

  return map;
}

async function getUserEmail(supabase: SupabaseClient, userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.auth.admin.getUserById(userId);
    if (error) {
      console.warn("[user-alert-dispatch] auth admin getUserById failed", { userId, error });
      return null;
    }
    const email = safeText((data as any)?.user?.email);
    return email ?? null;
  } catch (error) {
    console.warn("[user-alert-dispatch] auth admin getUserById exception", { userId, error });
    return null;
  }
}

async function sendResendEmail({
  to,
  subject,
  bodyText,
}: {
  to: string;
  subject: string;
  bodyText: string;
}): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Provider not configured; treat as a no-op success in development.
    console.log("[user-alert-dispatch] RESEND_API_KEY not set; skipping email send");
    return { ok: true };
  }

  const from = process.env.ALERTS_FROM_EMAIL || "alerts@magnusflipper.ai";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      text: bodyText,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return { ok: false, error: text || `Resend error ${res.status}` };
  }

  return { ok: true };
}

function buildNotificationPayload(deal: DealRow) {
  const title = safeText(deal.title) ?? "New deal found";
  const price = safeNumber(deal.price);
  const location = safeText(deal.location);
  const score = safeNumber(deal.score) ?? 0;
  const imageUrl = safeText(deal.primary_image) ?? null;
  const region = normalizeDealRegion(deal.region);
  const currencySymbol = region === "UK" ? "£" : "$";

  const parts: string[] = [];
  if (typeof price === "number") parts.push(`${currencySymbol}${Math.round(price).toLocaleString()}`);
  if (location) parts.push(location);
  parts.push(`Score ${Math.round(score)}`);

  return {
    title,
    body: parts.join(" · "),
    url: safeText(deal.url) ?? "",
    marketplace: deal.marketplace,
    listingId: safeText(deal.listing_id) ?? "",
    imageUrl,
  };
}

async function insertAlertEvent({
  supabase,
  userId,
  deal,
  searchId,
}: {
  supabase: SupabaseClient;
  userId: string;
  deal: DealRow;
  searchId: string;
}): Promise<{ eventId: string | null; deduped: boolean }> {
  const listingId = safeText(deal.listing_id);
  if (!listingId) return { eventId: null, deduped: false };

  const cooldownKey = buildCooldownKey({
    userId,
    marketplace: deal.marketplace,
    listingId,
  });

  const payload = buildNotificationPayload(deal);

  const { data, error } = await supabase
    .from("alert_events")
    .insert({
      user_id: userId,
      marketplace: deal.marketplace,
      listing_id: listingId,
      deal_id: deal.id,
      search_id: searchId,
      score: safeNumber(deal.score) ?? 0,
      cooldown_key: cooldownKey,
      payload,
    })
    .select("id")
    .maybeSingle();

  if (error) {
    // Dedupe conflict (cooldown key already exists)
    if (String((error as any).code) === "23505") {
      return { eventId: null, deduped: true };
    }
    console.error("[user-alert-dispatch] alert_events insert failed", { userId, listingId, error });
    return { eventId: null, deduped: false };
  }

  const eventId = safeText((data as any)?.id);
  return { eventId: eventId ?? null, deduped: false };
}

async function markDeliveryStatus(
  supabase: SupabaseClient,
  deliveryId: string,
  status: "sent" | "failed" | "skipped",
  error?: string | null
) {
  await supabase
    .from("alert_deliveries")
    .update({
      status,
      error: error ?? null,
      updated_at: new Date().toISOString(),
      sent_at: status === "sent" ? new Date().toISOString() : null,
    })
    .eq("id", deliveryId);
}

async function createDeliveryRow({
  supabase,
  eventId,
  userId,
  channel,
  provider,
  endpoint,
}: {
  supabase: SupabaseClient;
  eventId: string;
  userId: string;
  channel: "push" | "email";
  provider?: string | null;
  endpoint?: string | null;
}): Promise<string | null> {
  const { data, error } = await supabase
    .from("alert_deliveries")
    .insert({
      alert_event_id: eventId,
      user_id: userId,
      channel,
      provider: provider ?? null,
      endpoint: endpoint ?? null,
      status: "pending",
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[user-alert-dispatch] alert_deliveries insert failed", { eventId, channel, error });
    return null;
  }
  return safeText((data as any)?.id) ?? null;
}

async function dispatchForUser({
  supabase,
  userId,
  tier,
  settings,
  deal,
  matchingSearchIds,
}: {
  supabase: SupabaseClient;
  userId: string;
  tier: PricingTier;
  settings: NotificationSettingsRow | null;
  deal: DealRow;
  matchingSearchIds: string[];
}) {
  const ageMinutes = ageMinutesFromDeal(deal);
  const scoreRaw = safeNumber(deal.score);
  if (ageMinutes === null || scoreRaw === null) return;

  const region = normalizeDealRegion((deal as any).region);
  const category = isCarDeal(deal) ? "car" : "general";
  const thresholds = getAlertThresholds(region, tier, category).alert;

  const score =
    isCarDeal(deal) ? applyMileageModifier(scoreRaw, extractCarMileage(deal)) : scoreRaw;

  if (score < thresholds.minScore) return;
  if (ageMinutes > thresholds.maxAgeMinutes) return;

  const pushEnabled = Boolean(settings?.push_enabled);
  const emailEnabled = settings ? Boolean(settings.email_enabled) : true;

  if (isWithinQuietHours(settings)) {
    // Quiet hours suppress notifications (no delayed delivery in v1).
    // Record one event per matching search (dedupe protects repeats).
    for (const searchId of matchingSearchIds) {
      if (!perSearchEnabled(settings, searchId)) continue;
      const inserted = await insertAlertEvent({ supabase, userId, deal, searchId });
      if (!inserted.eventId || inserted.deduped) continue;

      const deliveryId = await createDeliveryRow({
        supabase,
        eventId: inserted.eventId,
        userId,
        channel: "push",
        provider: "quiet_hours",
      });
      if (deliveryId) await markDeliveryStatus(supabase, deliveryId, "skipped", "QUIET_HOURS");
    }
    return;
  }

  const pushSubs = parsePushSubscriptions(settings?.push_subscriptions);

  // For each matching search, insert an event (deduped per listing/user/cooldown) then attempt delivery.
  for (const searchId of matchingSearchIds) {
    if (!perSearchEnabled(settings, searchId)) continue;

    const inserted = await insertAlertEvent({ supabase, userId, deal, searchId });
    if (inserted.deduped) continue;
    if (!inserted.eventId) continue;

    let delivered = false;

    if (pushEnabled && pushConfigured() && pushSubs.length > 0) {
      configureWebPushOnce();

      for (const sub of pushSubs) {
        const endpoint = safeText((sub as any)?.endpoint) ?? null;
        const deliveryId = await createDeliveryRow({
          supabase,
          eventId: inserted.eventId,
          userId,
          channel: "push",
          provider: "webpush",
          endpoint,
        });
        if (!deliveryId) continue;

        try {
          const payload = buildNotificationPayload(deal);
          if (process.env.PUSH_DRY_RUN === "true") {
            await markDeliveryStatus(supabase, deliveryId, "sent", null);
            delivered = true;
            continue;
          }

          await webpush.sendNotification(sub, JSON.stringify(payload));
          await markDeliveryStatus(supabase, deliveryId, "sent", null);
          delivered = true;
        } catch (error: any) {
          await markDeliveryStatus(supabase, deliveryId, "failed", String(error?.message ?? error));
        }
      }
    }

    if (!delivered && emailEnabled) {
      const email = await getUserEmail(supabase, userId);
      if (!email) continue;

      const deliveryId = await createDeliveryRow({
        supabase,
        eventId: inserted.eventId,
        userId,
        channel: "email",
        provider: "resend",
      });
      if (!deliveryId) continue;

      const payload = buildNotificationPayload(deal);
      const subject = `New deal: ${payload.title}`;
      const bodyText = [
        payload.title,
        payload.body,
        payload.url,
        payload.imageUrl ? `Image: ${payload.imageUrl}` : null,
      ]
        .filter(Boolean)
        .join("\n");

      try {
        const result = await sendResendEmail({ to: email, subject, bodyText });
        if (result.ok) {
          await markDeliveryStatus(supabase, deliveryId, "sent", null);
        } else {
          await markDeliveryStatus(supabase, deliveryId, "failed", result.error ?? "EMAIL_FAILED");
        }
      } catch (error: any) {
        await markDeliveryStatus(supabase, deliveryId, "failed", String(error?.message ?? error));
      }
    }
  }
}

async function dispatchAlertsForDealListing({
  supabase,
  marketplace,
  listingId,
}: {
  supabase: SupabaseClient;
  marketplace: string;
  listingId: string;
}) {
  const deal = await loadDealByListingId(supabase, marketplace, listingId);
  if (!deal) return;

  const region = normalizeDealRegion((deal as any).region);
  const searches = await loadActiveSearchesForMarketplace(supabase, marketplace, region);
  if (searches.length === 0) return;

  const matchesByUser = new Map<string, string[]>();
  for (const search of searches) {
    const userId = safeText(search.user_id);
    if (!userId) continue;
    if (!dealMatchesSavedSearch(deal as any, search as any)) continue;
    const list = matchesByUser.get(userId) ?? [];
    list.push(search.id);
    matchesByUser.set(userId, list);
  }

  const userIds = Array.from(matchesByUser.keys());
  if (userIds.length === 0) return;

  const [settingsByUser, tierByUser] = await Promise.all([
    loadNotificationSettingsByUser(supabase, userIds),
    loadSubscriptionTiers(supabase, userIds),
  ]);

  for (const userId of userIds) {
    const tier = tierByUser.get(userId) ?? "FREE_BASIC";
    const settings = settingsByUser.get(userId) ?? null;
    const matchingSearchIds = matchesByUser.get(userId) ?? [];
    await dispatchForUser({ supabase, userId, tier, settings, deal, matchingSearchIds });
  }
}

export function startUserAlertDispatchWorker(): Worker<AlertDispatchJob> {
  console.log("[user-alert-dispatch] starting BullMQ worker");

  return new Worker<AlertDispatchJob>(
    "alert-dispatch",
    async (job) => {
      const supabase = getSupabase();
      const payload = job.data;

      if (!payload || typeof (payload as any).type !== "string") return;

      if (payload.type === "ALERT_DISPATCH_DEAL") {
        const marketplace = safeText((payload as any).marketplace);
        const listingId = safeText((payload as any).listingId);
        if (!marketplace || !listingId) return;
        await dispatchAlertsForDealListing({ supabase, marketplace, listingId });
        return;
      }

      if (payload.type === "ALERT_DISPATCH_BATCH") {
        const marketplace = safeText((payload as any).marketplace);
        const listingIds = Array.isArray((payload as any).listingIds)
          ? (payload as any).listingIds.map((v: any) => safeText(v)).filter(Boolean)
          : [];
        if (!marketplace || listingIds.length === 0) return;

        // Deterministic order.
        listingIds.sort((a: string, b: string) => a.localeCompare(b));

        for (const listingId of listingIds) {
          await dispatchAlertsForDealListing({ supabase, marketplace, listingId });
        }
      }
    },
    {
      connection: redis,
      concurrency: Math.max(1, Number.parseInt(process.env.ALERT_DISPATCH_CONCURRENCY || "3", 10) || 3),
    }
  );
}
