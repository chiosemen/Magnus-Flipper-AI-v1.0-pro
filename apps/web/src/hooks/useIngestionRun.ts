import { useCallback, useEffect, useRef, useState } from "react";

export type IngestStatus =
  | "queued"
  | "running"
  | "completed"
  | "partial"
  | "failed";

interface RunResponse {
  jobId: string;
  status: "queued";
  receivedAt: string;
}

interface StatusResponse {
  status: IngestStatus;
  results?: any[];
}

export function useIngestionRun() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<IngestStatus | null>(null);
  const [progress, setProgress] = useState<{ total: number; completed: number; failed: number } | null>(null);
  const [results, setResults] = useState<any[] | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const runIngestion = useCallback(async (payload: any) => {
    const res = await fetch("/api/ingest/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload)
    });

    const data: RunResponse = await res.json();
    setJobId(data.jobId);
    setStatus("queued");
    return data.jobId;
  }, []);

  const pollStatus = useCallback(async (id: string) => {
    const res = await fetch(`/api/ingest/status/${id}`);

    const data: StatusResponse = await res.json();
    setStatus(data.status);

    // Update progress based on status
    if (data.status === "running") {
      setProgress({ total: 100, completed: 50, failed: 0 });
    } else if (data.status === "completed") {
      setProgress({ total: 100, completed: 100, failed: 0 });
    }

    // If completed, extract results from status response
    if (data.status === "completed" && data.results) {
      setResults(data.results);
      if (pollingRef.current) clearInterval(pollingRef.current);
    } else if (data.status === "failed") {
      if (pollingRef.current) clearInterval(pollingRef.current);
    }
  }, []);

  useEffect(() => {
    if (!jobId) return;

    pollingRef.current = setInterval(() => {
      pollStatus(jobId);
    }, 2000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [jobId, pollStatus]);

  return {
    runIngestion,
    requestId: jobId, // Keep requestId for backward compatibility with MM Agent page
    status,
    progress,
    results
  };
}
