"use client";

import { Badge } from "@/marketing-swoopa/components/ui/card";
import type { FeedConnectionStatus } from "@magnus-flipper-ai/core/types/feed";

interface RealtimeIndicatorProps {
  status: FeedConnectionStatus;
  lastUpdate?: Date;
}

/**
 * RealtimeIndicator - Shows SSE connection status
 * Uses design tokens for styling
 */
export function RealtimeIndicator({ status, lastUpdate }: RealtimeIndicatorProps) {
  const getStatusColor = () => {
    switch (status) {
      case "connected":
        return "bg-success/20 text-success";
      case "connecting":
        return "bg-warning/20 text-warning";
      case "error":
        return "bg-destructive/20 text-destructive";
      default:
        return "bg-surfaceSubtle text-text-secondary";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "connected":
        return "Live";
      case "connecting":
        return "Connecting...";
      case "error":
        return "Error";
      default:
        return "Offline";
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Badge className={getStatusColor()}>
        <span className="flex items-center gap-1.5">
          {status === "connected" && (
            <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
          )}
          {getStatusText()}
        </span>
      </Badge>
      {lastUpdate && status === "connected" && (
        <span className="text-body-s text-text-secondary">
          Updated {lastUpdate.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}
