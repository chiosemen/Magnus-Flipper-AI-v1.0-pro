import { useCallback, useEffect, useRef, useState } from "react";

const WORKER_BASE_URL = process.env.NEXT_PUBLIC_WORKER_URL!;
const MM_AGENT_TOKEN = process.env.NEXT_PUBLIC_MM_AGENT_TOKEN!;

export type IngestStatus =
  | "queued"
  | "running"
  | "completed"
  | "partial"
  | "failed";

interface RunResponse {
  requestId: string;
  status: "accepted";
}

interface StatusResponse {
  requestId: string;
  status: IngestStatus;
  progress: {
    total: number;
    completed: number;
    failed: number;
  };
}

interface ResultsResponse {
  requestId: string;
  results: any[];
}

export function useIngestionRun() {
  const [requestId, setRequestId] = useState<string | null>(null);
  const [status, setStatus] = useState<IngestStatus | null>(null);
  const [progress, setProgress] = useState<StatusResponse["progress"] | null>(null);
  const [results, setResults] = useState<any[] | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const runIngestion = useCallback(async (payload: any) => {
    const res = await fetch(`${WORKER_BASE_URL}/ingest/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-mm-agent-token": MM_AGENT_TOKEN
      },
      body: JSON.stringify(payload)
    });

    const data: RunResponse = await res.json();
    setRequestId(data.requestId);
    setStatus("queued");
    return data.requestId;
  }, []);

  const fetchResults = useCallback(async (id: string) => {
    const res = await fetch(`${WORKER_BASE_URL}/ingest/results/${id}`, {
      headers: {
        "x-mm-agent-token": MM_AGENT_TOKEN
      }
    });

    const data: ResultsResponse = await res.json();
    setResults(data.results);
  }, []);

  const pollStatus = useCallback(async (id: string) => {
    const res = await fetch(`${WORKER_BASE_URL}/ingest/status/${id}`, {
      headers: {
        "x-mm-agent-token": MM_AGENT_TOKEN
      }
    });

    const data: StatusResponse = await res.json();
    setStatus(data.status);
    setProgress(data.progress);

    if (["completed", "partial", "failed"].includes(data.status)) {
      if (pollingRef.current) clearInterval(pollingRef.current);
      fetchResults(id);
    }
  }, [fetchResults]);

  useEffect(() => {
    if (!requestId) return;

    pollingRef.current = setInterval(() => {
      pollStatus(requestId);
    }, 3000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [requestId, pollStatus]);

  return {
    runIngestion,
    requestId,
    status,
    progress,
    results
  };
}
