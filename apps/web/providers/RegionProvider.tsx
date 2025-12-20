"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { detectAppRegion, normalizeAppRegion, type AppRegion } from "@/lib/appRegion";

type RegionContextValue = {
  region: AppRegion;
  setRegion: (region: AppRegion) => void;
};

const RegionContext = createContext<RegionContextValue | null>(null);

function regionFromUser(user: any): AppRegion | null {
  const meta = user?.user_metadata ?? user?.app_metadata ?? {};
  return (
    normalizeAppRegion(meta?.region) ??
    normalizeAppRegion(meta?.country) ??
    normalizeAppRegion(meta?.billing_country) ??
    normalizeAppRegion(meta?.billingCountry) ??
    null
  );
}

export function RegionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [region, setRegionState] = useState<AppRegion>("US");

  // Keep in sync with URL override + user metadata.
  useEffect(() => {
    const urlRegion = normalizeAppRegion(searchParams.get("region"));
    const userRegion = regionFromUser(user);
    const detected = detectAppRegion();

    const next = urlRegion ?? userRegion ?? detected;
    setRegionState(next);
  }, [searchParams, user?.id]);

  const setRegion = (next: AppRegion) => {
    setRegionState(next);

    // Encode the selection in the URL (?region=US|UK) to keep app + API inference consistent.
    const params = new URLSearchParams(searchParams.toString());
    params.set("region", next);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const value = useMemo<RegionContextValue>(() => ({ region, setRegion }), [region]);

  return <RegionContext.Provider value={value}>{children}</RegionContext.Provider>;
}

export function useRegion(): RegionContextValue {
  const ctx = useContext(RegionContext);
  if (!ctx) throw new Error("useRegion must be used within <RegionProvider />");
  return ctx;
}

