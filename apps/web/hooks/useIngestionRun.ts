import { useCallback, useEffect, useRef, useState } from "react";

export type IngestStatus =
  | "queued"
  | "running"
  | "completed"
  | "partial"
  | "failed";

interface RunResponse {
  jobId: string;
}

interface StatusResponse {
  jobId: string;
  status: IngestStatus;
  message: string;
  progress: {
    totalBatches: number;
    doneBatches: number;
  };
  results?: any[];
}

export function useIngestionRun() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<IngestStatus | null>(null);
  const [message, setMessage] = useState<string>("");
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

    if (!res.ok) {
      throw new Error("Failed to start ingestion");
    }

    const data: RunResponse = await res.json();
    setJobId(data.jobId);
    setStatus("queued");
    setMessage("Signal warming up");
    setResults(null); // Reset results for new job
    return data.jobId;
  }, []);

  const pollStatus = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/ingest/status/${id}`);

      if (!res.ok) {
        if (res.status === 404) {
          setStatus("failed");
          setMessage("Job not found");
          if (pollingRef.current) clearInterval(pollingRef.current);
        }
        return;
      }

      const data: StatusResponse = await res.json();
      setStatus(data.status);
      setMessage(data.message || "");

      // Calculate progress percentage from batches
      const { totalBatches, doneBatches } = data.progress;
      if (totalBatches > 0) {
        const percentage = Math.round((doneBatches / totalBatches) * 100);
        setProgress({
          total: totalBatches,
          completed: doneBatches,
          failed: 0,
        });
      } else {
        // Fallback progress calculation
        if (data.status === "running") {
          setProgress({ total: 100, completed: 50, failed: 0 });
        } else if (data.status === "completed") {
          setProgress({ total: 100, completed: 100, failed: 0 });
        }
      }

      // Stream results as they arrive (not just on completion)
      if (data.results && data.results.length > 0) {
        setResults(data.results);
      }

      // Stop polling when job is complete or failed
      if (data.status === "completed" || data.status === "failed") {
        if (pollingRef.current) clearInterval(pollingRef.current);
      }
    } catch (error) {
      console.error("Error polling status:", error);
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
    message,
    progress,
    results
  };
}
