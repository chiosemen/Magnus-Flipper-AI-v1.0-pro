"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export type RefreshState = "idle" | "queued" | "refreshing" | "updated" | "error";

type TriggerOpts = {
  instant?: boolean;
};

type RefreshResult = {
  state: RefreshState;
  error?: string;
  lastUpdatedAt?: number;
  trigger: (opts?: TriggerOpts) => Promise<void>;
  reset: () => void;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toErrorMessage(value: unknown): string {
  if (value && typeof value === "object" && "message" in value) {
    const message = (value as any).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  if (typeof value === "string" && value.trim()) return value;
  return "REFRESH_FAILED";
}

export function useInstantRefresh(poolId: string): RefreshResult {
  const [state, setState] = useState<RefreshState>("idle");
  const [error, setError] = useState<string | undefined>(undefined);

  const lastUpdatedAtRef = useRef<number | undefined>(undefined);
  const requestIdRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const trigger = useCallback(
    async (opts?: TriggerOpts) => {
      requestIdRef.current += 1;
      const requestId = requestIdRef.current;

      setError(undefined);
      lastUpdatedAtRef.current = undefined;
      setState("queued");

      try {
        // Guardrail: UI must never enqueue scraping in production.
        if (process.env.NODE_ENV !== "development") {
          throw new Error("REFRESH_DISABLED");
        }

        if (!poolId || typeof poolId !== "string") {
          throw new Error("POOL_ID_REQUIRED");
        }

        const supabase = supabaseBrowser();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const token = session?.access_token;
        if (!token) {
          throw new Error("NOT_AUTHENTICATED");
        }

        const isInstant = Boolean(opts?.instant);
        const res = await fetch("/api/refresh/facebook", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ poolId, isInstant }),
        });

        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error((payload as any)?.error || "REFRESH_FAILED");
        }

        if (!isMountedRef.current || requestIdRef.current !== requestId) return;
        setState("refreshing");

        const settleDelayMs = isInstant ? 2_000 : 5_000;
        await sleep(settleDelayMs);

        if (!isMountedRef.current || requestIdRef.current !== requestId) return;
        lastUpdatedAtRef.current = Date.now();
        setState("updated");
      } catch (err) {
        if (!isMountedRef.current || requestIdRef.current !== requestId) return;
        console.error("useInstantRefresh error", err);
        setError(toErrorMessage(err));
        setState("error");
      }
    },
    [poolId]
  );

  const reset = useCallback(() => {
    requestIdRef.current += 1;
    lastUpdatedAtRef.current = undefined;
    setError(undefined);
    setState("idle");
  }, []);

  return {
    state,
    error,
    lastUpdatedAt: lastUpdatedAtRef.current,
    trigger,
    reset,
  };
}
