'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { StatusCard } from '@/components/StatusCard';
import { RevisionCard } from '@/components/RevisionCard';
import { Charts } from '@/components/Charts';

export default function ReplayPage() {
  const params = useParams();
  const runId = params.runId as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/replay/${runId}`)
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading replay:', err);
        setLoading(false);
      });
  }, [runId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading replay data...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Replay data not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground">
              🔄 Canary Replay
            </h1>
            <p className="text-muted-foreground mt-2">
              Run ID: {runId} • {new Date(data.timestamp).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <RevisionCard revisions={data.revisions} />
          <StatusCard mlDecision={data.ml} health={data.health} />
        </div>

        <Charts metrics={data} />

        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-2xl font-semibold mb-4">📄 Historical Logs</h2>
          <div className="bg-background rounded p-4 h-96 overflow-y-auto font-mono text-sm">
            {data.logs?.map((log: string, i: number) => (
              <div key={i} className="text-foreground mb-1">
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
