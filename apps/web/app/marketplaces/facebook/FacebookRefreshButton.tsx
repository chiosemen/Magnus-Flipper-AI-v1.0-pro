"use client";

import { useInstantRefresh } from "@/hooks/useInstantRefresh";
import { Button } from "../../../marketing-swoopa/components/ui/button";

export function FacebookRefreshButton({ poolId }: { poolId: string }) {
  // Guardrail: web UI must never enqueue scraping in production.
  if (process.env.NODE_ENV !== "development") return null;

  const { state, error, trigger, lastUpdatedAt } = useInstantRefresh(poolId);

  const disabled = state === "queued" || state === "refreshing";

  return (
    <div className="space-y-2">
      <Button
        type="button"
        disabled={disabled}
        onClick={() => trigger({ instant: true })}
        className="bg-gradient-to-r from-[#00E5FF] to-[#7B2FFF] text-white disabled:opacity-50"
      >
        {state === "idle" && "Instant Refresh"}
        {state === "queued" && "Queued…"}
        {state === "refreshing" && "Refreshing…"}
        {state === "updated" && "Updated ✓"}
        {state === "error" && "Retry"}
      </Button>

      {state === "updated" && lastUpdatedAt && (
        <p className="text-xs text-white/50 font-medium">
          Updated {new Date(lastUpdatedAt).toLocaleTimeString()}
        </p>
      )}

      {state === "error" && (
        <p className="text-xs text-red-300">
          {error ?? "Something went wrong"}
        </p>
      )}
    </div>
  );
}
