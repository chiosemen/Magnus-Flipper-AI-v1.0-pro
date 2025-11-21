"use client";

import { useEffect, useState } from "react";
import { Watchlist, WatchlistCreateInput } from "@magnus-flipper-ai/sdk";
import { useMagnusSDK } from "@magnus-flipper-ai/sdk/provider/useMagnusSDK";

export function useWatchlists() {
  const sdk = useMagnusSDK();
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetchWatchlists() {
    setLoading(true);
    try {
      const data = await sdk.watchlists.list();
      setWatchlists(data);
    } finally {
      setLoading(false);
    }
  }

  async function createWatchlist(payload: WatchlistCreateInput) {
    const newWL = await sdk.watchlists.create(payload);
    setWatchlists((prev) => [...prev, newWL]);
  }

  async function deleteWatchlist(id: string) {
    await sdk.watchlists.delete(id);
    setWatchlists((prev) => prev.filter((w) => w.id !== id));
  }

  useEffect(() => {
    fetchWatchlists();
  }, []);

  return { watchlists, loading, createWatchlist, deleteWatchlist };
}
