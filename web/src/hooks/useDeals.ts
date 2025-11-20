"use client";

import { useEffect, useState } from "react";
import { MagnusSDK, Deal } from "@magnus/sdk";

const sdk = new MagnusSDK({ baseURL: process.env.NEXT_PUBLIC_API_URL });

export function useDeals(minScore = 0) {
  const [data, setData] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    sdk.deals
      .list(minScore)
      .then((res) => setData(res.deals))
      .catch((err) => {
        console.error("Failed fetching deals", err);
        setData([]);
      })
      .finally(() => setLoading(false));
  }, [minScore]);

  return { data, loading };
}
