// apps/web/app/dashboard-exec/components/WorkerDetailCard.tsx

"use client";

import type { WorkerHealthStatus } from "@magnus-flipper-ai/core";

type Props = {
  worker: WorkerHealthStatus;
};

export function WorkerDetailCard({ worker }: Props) {
  return (
    <div className="space-y-3 text-sm">
      <div>
        <div className="text-xs text-[#a0a0a0] mb-1">Health Check Status</div>
        <div className="text-[#ededed]">
          Last checked: {new Date(worker.lastHeartbeat).toLocaleString()}
        </div>
      </div>
      
      <div>
        <div className="text-xs text-[#a0a0a0] mb-1">Error Summary</div>
        <div className="text-[#ededed]">
          {worker.errorCount15m} errors in the last 15 minutes
        </div>
      </div>
      
      <div>
        <div className="text-xs text-[#a0a0a0] mb-1">Performance</div>
        <div className="text-[#ededed]">
          Failure rate: {(worker.failureRate * 100).toFixed(2)}%
        </div>
      </div>
    </div>
  );
}

