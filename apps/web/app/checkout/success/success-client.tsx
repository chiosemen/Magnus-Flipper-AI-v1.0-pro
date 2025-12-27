"use client";

import { useSearchParams } from "next/navigation";

export default function CheckoutSuccessClient() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");

  return (
    <div className="mx-auto max-w-xl py-24 text-center">
      <h1 className="text-2xl font-semibold">Scan Capacity Reserved</h1>

      <p className="mt-4 text-sm text-muted-foreground">
        Live signal active. Fetching fresh listings now.
      </p>

      {sessionId && (
        <p className="mt-6 text-xs text-muted-foreground">
          Reference: {sessionId}
        </p>
      )}
    </div>
  );
}
