/**
 * Conversion Path Tracking Hook
 * 
 * React hook for tracking user conversion paths through the marketing funnel.
 * Non-blocking, fire-and-forget implementation suitable for static and dynamic routes.
 */

import { useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { bufferEvent, flushEvents } from "@/lib/conversion/storage";
import type {
  ConversionEvent,
  ConversionEventType,
  ClickTrackingParams,
  ConversionTrackingParams,
} from "@/types/conversion";

// Generate or retrieve session ID
function getSessionId(): string {
  if (typeof window === "undefined") {
    return "";
  }

  const key = "magnus_session_id";
  let sessionId = sessionStorage.getItem(key);

  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(key, sessionId);
  }

  return sessionId;
}

// Generate or retrieve anonymous user ID
function getAnonUserId(): string {
  if (typeof window === "undefined") {
    return "";
  }

  const key = "magnus_anon_user_id";
  let userId = localStorage.getItem(key);

  if (!userId) {
    userId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(key, userId);
  }

  return userId;
}

// Generate UUID for event
function generatePathId(): string {
  return `path_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Track a conversion event
 */
function trackEvent(
  eventType: ConversionEventType,
  fromPage: string,
  toPage: string | null = null,
  metadata?: Record<string, unknown>
): void {
  const event: ConversionEvent = {
    pathId: generatePathId(),
    fromPage,
    toPage,
    eventType,
    timestamp: Date.now(),
    sessionId: getSessionId(),
    anonUserId: getAnonUserId(),
    metadata,
  };

  bufferEvent(event);

  // Periodically flush events (every 10 events)
  if (typeof window !== "undefined") {
    try {
      const events = JSON.parse(localStorage.getItem("magnus_conversion_events") || "[]");
      if (events.length >= 10) {
        flushEvents().catch(() => {
          // Silently fail - events are buffered
        });
      }
    } catch {
      // Ignore errors reading localStorage
    }
  }
}

/**
 * Hook for conversion path tracking
 */
export function useConversionPath() {
  const pathname = usePathname();
  const lastPageRef = useRef<string | null>(null);
  const flushIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Track page views
  useEffect(() => {
    if (!pathname) {
      return;
    }

    // Track page view
    trackEvent("page_view", pathname, null);

    // Track navigation if coming from another page
    if (lastPageRef.current && lastPageRef.current !== pathname) {
      trackEvent("secondary_link_click", lastPageRef.current, pathname);
    }

    lastPageRef.current = pathname;

    // Set up periodic flush (every 30 seconds)
    if (flushIntervalRef.current) {
      clearInterval(flushIntervalRef.current);
    }

    flushIntervalRef.current = setInterval(() => {
      flushEvents().catch(() => {
        // Silently fail
      });
    }, 30000);

    // Flush on page unload
    const handleBeforeUnload = () => {
      flushEvents().catch(() => {
        // Silently fail
      });
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      if (flushIntervalRef.current) {
        clearInterval(flushIntervalRef.current);
      }
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [pathname]);

  const trackView = useCallback((page: string) => {
    trackEvent("page_view", page);
  }, []);

  const trackClick = useCallback((params: ClickTrackingParams) => {
    const eventType =
      params.intent === "primary" ? "primary_cta_click" : "secondary_link_click";
    trackEvent(eventType, params.source, params.target, {
      intent: params.intent,
    });
  }, []);

  const trackConversion = useCallback((params: ConversionTrackingParams) => {
    trackEvent("api_success", pathname || "/", null, {
      conversionType: params.type,
      value: params.value,
      ...params.metadata,
    });
  }, [pathname]);

  const trackFailure = useCallback((error: string, metadata?: Record<string, unknown>) => {
    trackEvent("api_failure", pathname || "/", null, {
      error,
      ...metadata,
    });
  }, [pathname]);

  const trackFormSubmit = useCallback((formName: string, metadata?: Record<string, unknown>) => {
    trackEvent("form_submit", pathname || "/", null, {
      formName,
      ...metadata,
    });
  }, [pathname]);

  return {
    trackView,
    trackClick,
    trackConversion,
    trackFailure,
    trackFormSubmit,
  };
}
