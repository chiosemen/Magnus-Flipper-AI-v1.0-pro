import { useEffect, useRef, useState } from "react";
import { APIFY_POLL_INTERVAL_MS } from "@/config/apify";

export function useApifyDataset(datasetIds: string[]) {
  const [items, setItems] = useState<any[]>([]);
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!datasetIds || datasetIds.length === 0) return;

    seen.current.clear();
    setItems([]);

    const pollAll = async () => {
      try {
        const results = await Promise.all(
          datasetIds.map(async (id) => {
            const res = await fetch(`/api/apify/dataset?datasetId=${id}`);
            if (!res.ok) return [];
            return (await res.json()) as any[];
          })
        );

        const merged = results.flat();
        const fresh = merged.filter((item) => {
          const key = item.url || item.id || JSON.stringify(item);
          if (seen.current.has(key)) return false;
          seen.current.add(key);
          return true;
        });

        if (fresh.length > 0) {
          setItems((prev) => [...fresh, ...prev]);
        }
      } catch (error) {
        console.error("Apify dataset poll failed", error);
      }
    };

    pollAll(); // immediate
    const id = setInterval(pollAll, APIFY_POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [datasetIds.join("|")]);

  return items;
}
