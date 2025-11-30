/**
 * Alert Processor
 * Evaluates alert rules after scraping and creates notifications
 */

import { supabase } from "@magnus-flipper-ai/shared/supabase/client";
import {
  evaluateAlertRules,
  type AlertRule,
  type ListingToEvaluate,
  type AlertNotification,
} from "@magnus-flipper-ai/alert-engine";
import type { ScrapedListing } from "@magnus-flipper-ai/shared/marketplaces/types";

/**
 * Process alerts for newly scraped listings
 */
export async function processAlertsForListings(
  marketplace: string,
  listings: ScrapedListing[]
): Promise<void> {
  if (listings.length === 0) {
    console.log("[AlertProcessor] No listings to process alerts for");
    return;
  }

  console.log(
    `[AlertProcessor] Processing alerts for ${listings.length} listings from ${marketplace}`
  );

  try {
    // Step 1: Fetch active alert rules for this marketplace
    const alertRules = await fetchActiveAlertRules(marketplace);

    if (alertRules.length === 0) {
      console.log(
        `[AlertProcessor] No active alert rules found for ${marketplace}`
      );
      return;
    }

    console.log(
      `[AlertProcessor] Found ${alertRules.length} active alert rules`
    );

    // Step 2: Evaluate each listing against all alert rules
    const notificationsToCreate: AlertNotification[] = [];

    for (const listing of listings) {
      const listingToEvaluate: ListingToEvaluate = {
        id: undefined, // Will be set after DB insert
        marketplace: listing.marketplace,
        external_id: listing.external_id,
        title: listing.title,
        price: listing.price,
        url: listing.url,
        image_url: listing.image_url,
        location: listing.location,
        condition: listing.condition,
        posted_at: listing.posted_at,
      };

      const evaluationResults = evaluateAlertRules(
        alertRules,
        listingToEvaluate
      );

      // Create notifications for triggered alerts
      for (const result of evaluationResults) {
        if (result.triggered && "ruleId" in result && "ruleName" in result) {
          const rule = alertRules.find((r) => r.id === (result as any).ruleId);

          if (rule) {
            notificationsToCreate.push({
              alert_rule_id: rule.id,
              user_id: rule.user_id,
              trigger_type: rule.alert_type,
              trigger_reason: result.trigger_reason,
              listing_id: undefined, // Will be set if listing has ID
              marketplace: listing.marketplace,
              listing_title: listing.title,
              listing_price: listing.price || undefined,
              listing_url: listing.url,
              listing_location: listing.location,
              status: "PENDING",
            });
          }
        }
      }
    }

    // Step 3: Create alert notifications in database
    if (notificationsToCreate.length > 0) {
      console.log(
        `[AlertProcessor] Creating ${notificationsToCreate.length} alert notifications`
      );
      await createAlertNotifications(notificationsToCreate);
    } else {
      console.log(`[AlertProcessor] No alerts triggered`);
    }
  } catch (error: any) {
    console.error(
      `[AlertProcessor] Error processing alerts:`,
      error.message
    );
    // Log-only on failure (graceful degradation)
  }
}

/**
 * Fetch active alert rules for a marketplace
 */
async function fetchActiveAlertRules(
  marketplace?: string
): Promise<AlertRule[]> {
  try {
    let query = supabase
      .from("alert_rules")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: false });

    // Filter by marketplace if specified
    if (marketplace) {
      query = query.or(`marketplace.eq.${marketplace},marketplace.is.null`);
    }

    const { data, error } = await query;

    if (error) {
      console.error(
        `[AlertProcessor] Error fetching alert rules:`,
        error.message
      );
      return [];
    }

    return (data || []) as AlertRule[];
  } catch (error: any) {
    console.error(
      `[AlertProcessor] Exception fetching alert rules:`,
      error.message
    );
    return [];
  }
}

/**
 * Create alert notifications in database
 */
async function createAlertNotifications(
  notifications: AlertNotification[]
): Promise<void> {
  try {
    // Batch insert (Supabase supports up to 1000 rows)
    const batchSize = 100;
    const batches: AlertNotification[][] = [];

    for (let i = 0; i < notifications.length; i += batchSize) {
      batches.push(notifications.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      const { error } = await supabase
        .from("alert_notifications")
        .insert(batch);

      if (error) {
        console.error(
          `[AlertProcessor] Error creating alert notifications:`,
          error.message
        );
      } else {
        console.log(
          `[AlertProcessor] Created ${batch.length} alert notifications`
        );
      }
    }

    // Update alert rule trigger counts and timestamps
    await updateAlertRuleTriggers(notifications);
  } catch (error: any) {
    console.error(
      `[AlertProcessor] Exception creating alert notifications:`,
      error.message
    );
  }
}

/**
 * Update alert rule trigger counts and last triggered timestamp
 */
async function updateAlertRuleTriggers(
  notifications: AlertNotification[]
): Promise<void> {
  try {
    // Group notifications by alert_rule_id
    const triggersByRule = new Map<string, number>();

    for (const notification of notifications) {
      const count = triggersByRule.get(notification.alert_rule_id) || 0;
      triggersByRule.set(notification.alert_rule_id, count + 1);
    }

    // Update each rule
    for (const [ruleId, count] of triggersByRule.entries()) {
      const { error } = await supabase
        .from("alert_rules")
        .update({
          trigger_count: supabase.raw(`trigger_count + ${count}`),
          last_triggered_at: new Date().toISOString(),
        })
        .eq("id", ruleId);

      if (error) {
        console.error(
          `[AlertProcessor] Error updating alert rule ${ruleId}:`,
          error.message
        );
      }
    }
  } catch (error: any) {
    console.error(
      `[AlertProcessor] Exception updating alert rule triggers:`,
      error.message
    );
  }
}
