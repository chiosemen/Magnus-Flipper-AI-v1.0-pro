import crypto from "node:crypto";
import { QueueEvents } from "bullmq";
import { alertDispatchQueue, redis } from "@magnus-flipper-ai/queue";
import { getSupabase } from "../src/services/supabase";
import { startUserAlertDispatchWorker } from "../src/alerts/user-alert-dispatch-worker";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value.trim();
}

async function main() {
  // Ensure we're not using the build-time Redis mock.
  if (!process.env.REDIS_URL && !process.env.REDIS_HOST) {
    throw new Error(
      "Redis not configured. Set REDIS_URL=redis://localhost:6379 (and run redis) before running this script."
    );
  }

  // Supabase service role is required to insert pooled deals + notification rows.
  requireEnv("SUPABASE_URL");
  requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (process.env.PUSH_DRY_RUN !== "true") {
    throw new Error("Set PUSH_DRY_RUN=true for this acceptance script (avoids external network calls).");
  }

  // Push send is not executed when PUSH_DRY_RUN=true, but VAPID keys must exist to exercise push path.
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    throw new Error(
      "Missing VAPID keys. Set VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY (can be placeholders for PUSH_DRY_RUN=true)."
    );
  }

  const supabase = getSupabase();

  const testUserId = (process.env.TEST_USER_ID || crypto.randomUUID()).trim();
  const keyword = (process.env.TEST_KEYWORD || "iphone").trim();
  const marketplace = (process.env.TEST_MARKETPLACE || "facebook").trim().toLowerCase();

  const listingId = `accept-${Date.now()}`;
  const poolKey = `${marketplace}:acceptance:demo`;
  const nowIso = new Date().toISOString();
  const nonce = crypto.randomUUID();

  // 1) Insert a saved_search for the user (intent).
  const { data: searchRow, error: searchError } = await supabase
    .from("saved_searches")
    .insert({
      user_id: testUserId,
      marketplace,
      name: `Acceptance search - ${keyword}`,
      params: {
        __acceptance_nonce: nonce,
        keywords: [keyword],
        query: keyword,
      },
      status: "active",
      updated_at: nowIso,
    })
    .select("id")
    .single();

  if (searchError || !searchRow?.id) {
    throw new Error(`Failed to insert saved_searches row: ${searchError?.message || "unknown"}`);
  }

  // 2) Insert a pooled deal that matches the search (state).
  const imageUrl = "https://placehold.co/600x600/png";
  const { error: dealError } = await supabase
    .from("deals")
    .upsert(
      {
        search_id: null,
        marketplace,
        pool_key: poolKey,
        listing_id: listingId,
        title: `Hot deal ${keyword} - acceptance`,
        price: 199,
        currency: "$",
        score: 92,
        location: "London",
        url: `https://example.com/${listingId}`,
        images: [{ url: imageUrl }],
        primary_image: imageUrl,
        thumbnail: null,
        attributes: { category: "tech" },
        data: { demo: true },
        created_at: nowIso,
        fetched_at: nowIso,
        posted_at: nowIso,
      },
      { onConflict: "marketplace,listing_id" }
    );

  if (dealError) {
    throw new Error(`Failed to upsert pooled deal: ${dealError.message}`);
  }

  // 3) Enable push notifications for this user (no email fallback in this acceptance path).
  const { error: settingsError } = await supabase
    .from("user_notification_settings")
    .upsert(
      {
        user_id: testUserId,
        push_enabled: true,
        email_enabled: false,
        push_subscriptions: [
          {
            endpoint: "https://example.com/push-subscription",
            keys: { p256dh: "test", auth: "test" },
          },
        ],
        per_search: {
          [searchRow.id]: { enabled: true },
        },
        updated_at: nowIso,
      },
      { onConflict: "user_id" }
    );

  if (settingsError) {
    throw new Error(`Failed to upsert notification settings: ${settingsError.message}`);
  }

  // 4) Run the BullMQ worker in-process and enqueue an alert dispatch job.
  const worker = startUserAlertDispatchWorker();
  const queueEvents = new QueueEvents("alert-dispatch", { connection: redis as any });
  await queueEvents.waitUntilReady();

  try {
    const job = await alertDispatchQueue.add(
      "acceptance-alert-dispatch-deal",
      { type: "ALERT_DISPATCH_DEAL", marketplace, listingId },
      { removeOnComplete: true, removeOnFail: true }
    );

    await job.waitUntilFinished(queueEvents, 30_000);
  } finally {
    await queueEvents.close();
    await worker.close();
  }

  // 5) Verify DB facts: alert event and delivery rows exist and push was marked sent (PUSH_DRY_RUN).
  const { data: events, error: eventsError } = await supabase
    .from("alert_events")
    .select("id,user_id,marketplace,listing_id,search_id,score,created_at")
    .eq("user_id", testUserId)
    .eq("marketplace", marketplace)
    .eq("listing_id", listingId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (eventsError) {
    throw new Error(`Failed to query alert_events: ${eventsError.message}`);
  }
  if (!events || events.length === 0) {
    throw new Error("Acceptance failed: no alert_events rows created");
  }

  const { data: deliveries, error: deliveriesError } = await supabase
    .from("alert_deliveries")
    .select("id,alert_event_id,user_id,channel,status,provider,endpoint,created_at,sent_at")
    .eq("user_id", testUserId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (deliveriesError) {
    throw new Error(`Failed to query alert_deliveries: ${deliveriesError.message}`);
  }

  const hasPushSent = Array.isArray(deliveries)
    ? deliveries.some((d: any) => d.channel === "push" && d.status === "sent")
    : false;

  if (!hasPushSent) {
    throw new Error(
      "Acceptance failed: no push delivery marked sent. Ensure PUSH_DRY_RUN=true and VAPID keys are set."
    );
  }

  console.log("[acceptance] OK", {
    testUserId,
    marketplace,
    listingId,
    searchId: searchRow.id,
    eventId: (events[0] as any)?.id,
  });
}

main().catch((err) => {
  console.error("[acceptance] FAILED", err);
  process.exit(1);
});
