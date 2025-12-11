/**
 * Deal Notifications
 * Push notifications for new deals matching user's saved searches
 */

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { notifications } from './notifications';
import { api } from './api';
import { storage } from './storage';
import type { Listing } from '@magnus-flipper-ai/core';

const DEAL_NOTIFICATION_CHANNEL = 'new-deals';
const LAST_NOTIFIED_DEAL_KEY = 'lastNotifiedDealId';
const NOTIFICATION_ENABLED_KEY = 'dealNotificationsEnabled';

/**
 * Setup notification channel for Android
 */
export async function setupDealNotificationChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(DEAL_NOTIFICATION_CHANNEL, {
      name: 'New Deals',
      description: 'Notifications for new deals matching your searches',
      importance: Notifications.AndroidImportance.HIGH,
      sound: true,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#5CE0E6',
    });
  }
}

/**
 * Check if deal notifications are enabled
 */
export async function isDealNotificationsEnabled(): Promise<boolean> {
  const enabled = await storage.getBoolean(NOTIFICATION_ENABLED_KEY);
  return enabled !== false; // Default to true
}

/**
 * Enable/disable deal notifications
 */
export async function setDealNotificationsEnabled(enabled: boolean): Promise<void> {
  await storage.setBoolean(NOTIFICATION_ENABLED_KEY, enabled);
  
  if (enabled) {
    await notifications.requestPermissions();
    await setupDealNotificationChannel();
  }
}

/**
 * Get last notified deal ID
 */
async function getLastNotifiedDealId(): Promise<string | null> {
  return await storage.getItem(LAST_NOTIFIED_DEAL_KEY);
}

/**
 * Set last notified deal ID
 */
async function setLastNotifiedDealId(dealId: string): Promise<void> {
  await storage.setItem(LAST_NOTIFIED_DEAL_KEY, dealId);
}

/**
 * Format deal notification message
 */
function formatDealNotification(listing: Listing): { title: string; body: string } {
  const marketplace = listing.site?.toLowerCase() || 'marketplace';
  const location = listing.city || listing.region || '';
  const locationText = location ? ` in ${location}` : '';
  
  return {
    title: `🔥 New Deal: ${listing.title}`,
    body: `$${listing.price}${locationText} • ${marketplace}`,
  };
}

/**
 * Send notification for a new deal
 */
export async function notifyNewDeal(listing: Listing): Promise<void> {
  const enabled = await isDealNotificationsEnabled();
  if (!enabled) return;

  const lastNotifiedId = await getLastNotifiedDealId();
  
  // Don't notify if we already notified about this deal
  if (lastNotifiedId === listing.id) return;

  const { title, body } = formatDealNotification(listing);

  await notifications.scheduleNotification(title, body, {
    listingId: listing.id,
    type: 'new_deal',
    url: listing.url,
  });

  await setLastNotifiedDealId(listing.id);
}

/**
 * Batch notify for multiple new deals (enhanced with smart batching)
 */
export async function notifyNewDeals(
  listings: Listing[],
  maxNotifications = 5,
  options: {
    batchDelay?: number;
    prioritizeHighValue?: boolean;
  } = {}
): Promise<void> {
  const { batchDelay = 300, prioritizeHighValue = true } = options;
  const enabled = await isDealNotificationsEnabled();
  if (!enabled) return;

  // Sort by priority if enabled (price, recency, etc.)
  let dealsToNotify = listings;
  if (prioritizeHighValue && listings.length > maxNotifications) {
    dealsToNotify = [...listings].sort((a, b) => {
      // Prioritize: lower price (better deal), then more recent
      if (a.price !== b.price) return a.price - b.price;
      const aTime = a.postedAt ? new Date(a.postedAt).getTime() : 0;
      const bTime = b.postedAt ? new Date(b.postedAt).getTime() : 0;
      return bTime - aTime; // More recent first
    });
  }

  // Limit to max notifications to avoid spam
  dealsToNotify = dealsToNotify.slice(0, maxNotifications);

  // Batch notifications with optimized delay
  for (const listing of dealsToNotify) {
    await notifyNewDeal(listing);
    // Optimized delay between notifications (reduced for faster delivery)
    if (dealsToNotify.indexOf(listing) < dealsToNotify.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, batchDelay));
    }
  }
}

/**
 * Listen for new deals from realtime feed
 * This should be called when app starts or when entering feed screen
 */
export function setupDealNotificationListener(
  onNewDeal: (listing: Listing) => void
): () => void {
  // Listen for notification taps
  const subscription = notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    if (data?.type === 'new_deal' && data?.listingId) {
      // Navigate to listing detail
      onNewDeal(data as any);
    }
  });

  return () => {
    subscription.remove();
  };
}

/**
 * Check for new deals and send notifications
 * This should be called periodically or when feed updates
 */
export async function checkAndNotifyNewDeals(
  currentListings: Listing[],
  previousListingIds: Set<string>
): Promise<void> {
  const enabled = await isDealNotificationsEnabled();
  if (!enabled) return;

  // Find new listings
  const newListings = currentListings.filter(
    (listing) => !previousListingIds.has(listing.id)
  );

  if (newListings.length > 0) {
    await notifyNewDeals(newListings);
  }
}
