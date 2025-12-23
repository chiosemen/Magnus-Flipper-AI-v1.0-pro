/**
 * Stub hook - minimal UI-only implementation
 */
import { useState, useEffect } from "react";

export function useApifyDataset(datasetId?: string | string[]) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!datasetId || (Array.isArray(datasetId) && datasetId.length === 0)) {
      setData([]);
      return;
    }

    // Stub: would fetch from Apify in real implementation
    setLoading(false);
    setData([]);
  }, [datasetId]);

  return data;
}

