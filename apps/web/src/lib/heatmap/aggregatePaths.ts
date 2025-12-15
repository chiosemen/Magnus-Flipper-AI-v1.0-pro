/**
 * Conversion Path Aggregation
 * 
 * Processes conversion events to generate heatmap data for visualization.
 * Groups events by session, calculates node/edge weights, and identifies drop-off points.
 */

import type { ConversionEvent } from "@/types/conversion";
import type { HeatmapData, HeatmapNode, HeatmapEdge, DropOffPoint } from "@/types/heatmap";

/**
 * Aggregate conversion events into heatmap data
 */
export function aggregatePaths(events: ConversionEvent[]): HeatmapData {
  if (events.length === 0) {
    return {
      nodes: [],
      edges: [],
      dropOffs: [],
      conversionRate: 0,
      totalSessions: 0,
      totalEvents: 0,
    };
  }

  // Group events by session
  const sessions = new Map<string, ConversionEvent[]>();
  for (const event of events) {
    const sessionEvents = sessions.get(event.sessionId) || [];
    sessionEvents.push(event);
    sessions.set(event.sessionId, sessionEvents);
  }

  // Build page visit counts (node weights)
  const pageVisits = new Map<string, number>();
  const pageLabels = new Map<string, string>();

  for (const event of events) {
    if (event.fromPage) {
      pageVisits.set(event.fromPage, (pageVisits.get(event.fromPage) || 0) + 1);
      if (!pageLabels.has(event.fromPage)) {
        pageLabels.set(event.fromPage, formatPageLabel(event.fromPage));
      }
    }
    if (event.toPage) {
      pageVisits.set(event.toPage, (pageVisits.get(event.toPage) || 0) + 1);
      if (!pageLabels.has(event.toPage)) {
        pageLabels.set(event.toPage, formatPageLabel(event.toPage));
      }
    }
  }

  // Build transition counts (edge weights)
  const transitions = new Map<string, number>();

  for (const sessionEvents of sessions.values()) {
    // Sort events by timestamp
    const sorted = [...sessionEvents].sort((a, b) => a.timestamp - b.timestamp);

    for (let i = 0; i < sorted.length - 1; i++) {
      const from = sorted[i].fromPage;
      const to = sorted[i + 1].fromPage || sorted[i + 1].toPage;

      if (from && to && from !== to) {
        const key = `${from}→${to}`;
        transitions.set(key, (transitions.get(key) || 0) + 1);
      }
    }

    // Track explicit link clicks
    for (const event of sorted) {
      if (event.eventType === "primary_cta_click" || event.eventType === "secondary_link_click") {
        if (event.fromPage && event.toPage) {
          const key = `${event.fromPage}→${event.toPage}`;
          transitions.set(key, (transitions.get(key) || 0) + 1);
        }
      }
    }
  }

  // Build nodes
  const nodes: HeatmapNode[] = Array.from(pageVisits.entries()).map(([id, weight]) => ({
    id,
    weight,
    label: pageLabels.get(id) || id,
  }));

  // Build edges
  const edges: HeatmapEdge[] = Array.from(transitions.entries()).map(([key, weight]) => {
    const [source, target] = key.split("→");
    return { source, target, weight };
  });

  // Calculate drop-off points
  // A drop-off is a page_view without a subsequent navigation within the session
  const dropOffs = new Map<string, number>();

  for (const sessionEvents of sessions.values()) {
    const sorted = [...sessionEvents].sort((a, b) => a.timestamp - b.timestamp);
    const lastEvent = sorted[sorted.length - 1];

    // If last event is a page_view and no conversion occurred, it's a drop-off
    if (lastEvent.eventType === "page_view" && !hasConversion(sorted)) {
      const page = lastEvent.fromPage;
      dropOffs.set(page, (dropOffs.get(page) || 0) + 1);
    }
  }

  const dropOffPoints: DropOffPoint[] = Array.from(dropOffs.entries()).map(([page, count]) => {
    const totalVisits = pageVisits.get(page) || 1;
    return {
      page,
      count,
      rate: count / totalVisits,
    };
  });

  // Calculate conversion rate
  // Conversion = sessions with api_success events / total sessions
  let convertedSessions = 0;
  for (const sessionEvents of sessions.values()) {
    if (sessionEvents.some((e) => e.eventType === "api_success")) {
      convertedSessions++;
    }
  }

  const conversionRate = sessions.size > 0 ? convertedSessions / sessions.size : 0;

  return {
    nodes,
    edges,
    dropOffs: dropOffPoints,
    conversionRate,
    totalSessions: sessions.size,
    totalEvents: events.length,
  };
}

/**
 * Check if a session has a conversion event
 */
function hasConversion(events: ConversionEvent[]): boolean {
  return events.some((e) => e.eventType === "api_success");
}

/**
 * Format page path into display label
 */
function formatPageLabel(path: string): string {
  if (path === "/") {
    return "Home";
  }

  // Remove leading slash and format
  const cleaned = path.replace(/^\//, "").replace(/-/g, " ");

  // Capitalize first letter of each word
  return cleaned
    .split("/")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" → ");
}

