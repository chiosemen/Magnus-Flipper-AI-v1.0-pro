/**
 * Conversion Event Storage
 * 
 * Client-side buffering for conversion events using localStorage.
 * Prevents data loss on navigation and batches events for efficient transmission.
 */

import type { ConversionEvent } from "@/types/conversion";

const STORAGE_KEY = "magnus_conversion_events";
const MAX_BUFFER_SIZE = 50; // Maximum events to buffer before forcing flush

/**
 * Get all buffered events from localStorage
 */
export function getBufferedEvents(): ConversionEvent[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }
    return JSON.parse(stored) as ConversionEvent[];
  } catch (error) {
    console.warn("[Conversion] Failed to read buffered events:", error);
    return [];
  }
}

/**
 * Add an event to the buffer
 */
export function bufferEvent(event: ConversionEvent): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const events = getBufferedEvents();
    events.push(event);

    // Enforce max buffer size
    if (events.length > MAX_BUFFER_SIZE) {
      // Keep most recent events
      const trimmed = events.slice(-MAX_BUFFER_SIZE);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    }
  } catch (error) {
    // Handle quota exceeded or other storage errors
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      console.warn("[Conversion] Storage quota exceeded, flushing oldest events");
      // Flush oldest events and retry
      const events = getBufferedEvents();
      const trimmed = events.slice(-Math.floor(MAX_BUFFER_SIZE / 2));
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
        trimmed.push(event);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
      } catch (retryError) {
        console.error("[Conversion] Failed to buffer event after flush:", retryError);
      }
    } else {
      console.warn("[Conversion] Failed to buffer event:", error);
    }
  }
}

/**
 * Clear all buffered events
 */
export function clearBufferedEvents(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn("[Conversion] Failed to clear buffered events:", error);
  }
}

/**
 * Flush buffered events to API
 * Returns true if flush was successful
 */
export async function flushEvents(): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }

  const events = getBufferedEvents();
  if (events.length === 0) {
    return true; // Nothing to flush
  }

  try {
    const payload = JSON.stringify(events);
    
    // Try sendBeacon first (non-blocking, works on page unload)
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      const sent = navigator.sendBeacon("/api/analytics/convert", blob);
      if (sent) {
        clearBufferedEvents();
        return true;
      }
    }
    
    // Fallback to fetch with keepalive
    const response = await fetch("/api/analytics/convert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    });
    
    if (response.ok) {
      clearBufferedEvents();
      return true;
    }
    return false;
  } catch (error) {
    console.warn("[Conversion] Failed to flush events:", error);
    return false;
  }
}
