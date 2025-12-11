'use client';

import { useEffect, useState } from 'react';
import { StatusCard } from '@/components/StatusCard';
import { RevisionCard } from '@/components/RevisionCard';
import { Charts } from '@/components/Charts';
import { CompliancePanel } from '@/components/CompliancePanel';
import { useWebSocket } from '@/lib/socket';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [mlDecision, setMlDecision] = useState<any>(null);
  const ws = useWebSocket();

  useEffect(() => {
    // Fetch initial data
    fetch('/api/metrics')
      .then((res) => res.json())
      .then(setMetrics)
      .catch(console.error);

    // Listen to WebSocket events
    if (ws) {
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'metrics':
            setMetrics(data.payload);
            break;
          case 'logs':
            setLogs((prev) => [...prev.slice(-999), data.payload]);
            break;
          case 'ml_decision':
            setMlDecision(data.payload);
            break;
          case 'revision_update':
            fetch('/api/metrics').then((res) => res.json()).then(setMetrics);
            break;
        }
      };
    }

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [ws]);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold text-foreground">
            🚦 Enterprise Canary Monitor
          </h1>
          <div className="flex items-center gap-2">
            <div
              className={`h-3 w-3 rounded-full ${
                ws?.readyState === WebSocket.OPEN
                  ? 'bg-green-500'
                  : 'bg-red-500'
              }`}
            />
            <span className="text-sm text-muted-foreground">
              {ws?.readyState === WebSocket.OPEN ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <RevisionCard revisions={metrics?.revisions} />
          <StatusCard mlDecision={mlDecision || metrics?.ml} health={metrics?.health} />
        </div>

        <CompliancePanel />

        <Charts metrics={metrics} />

        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-2xl font-semibold mb-4">📄 Live Logs</h2>
          <div className="bg-background rounded p-4 h-96 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <p className="text-muted-foreground">No logs yet...</p>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="text-foreground mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
