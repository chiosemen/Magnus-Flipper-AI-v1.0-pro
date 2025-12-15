/**
 * Analytics Utility
 * 
 * Thin abstraction for analytics event tracking.
 * Non-blocking implementation that can be extended with any analytics provider.
 */

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, unknown>;
}

/**
 * Record an analytics event
 * 
 * Non-blocking - fires and forgets. Errors are silently caught.
 * Works in both browser and Node.js environments.
 */
export function recordEvent(eventName: string, properties?: Record<string, unknown>): void {
  try {
    const event: AnalyticsEvent = {
      event: eventName,
      properties,
    };

    // In production, integrate with your analytics provider here
    // Examples:
    // - PostHog: posthog.capture(eventName, properties)
    // - Mixpanel: mixpanel.track(eventName, properties)
    // - Amplitude: amplitude.track(eventName, properties)
    // - Custom: fetch('/api/analytics', { method: 'POST', body: JSON.stringify(event) })

    // For now, log to console in development
    if (process.env.NODE_ENV === "development") {
      console.log("[Analytics]", event);
    }

    // Send to custom endpoint (works in both browser and Node.js)
    if (typeof window !== "undefined") {
      // Browser: Non-blocking fetch (fire and forget)
      fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      }).catch(() => {
        // Silently fail - analytics should never break the app
      });
    } else {
      // Node.js: Can use fetch or internal event emitter
      // For now, just log (can be extended to send to internal analytics service)
    }
  } catch (error) {
    // Silently fail - analytics should never break the app
    if (process.env.NODE_ENV === "development") {
      console.warn("[Analytics] Failed to record event:", error);
    }
  }
}

