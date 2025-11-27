"use client";

export function useStartTrial() {
  const startTrial = async () => {
    const res = await fetch("/api/billing/mobile/trial-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Unable to start trial");
    }

    return res.json() as Promise<{ trial_expires_at?: string; url?: string }>;
  };

  return { startTrial };
}
