'use client';

interface StatusCardProps {
  mlDecision?: {
    decision?: string;
    confidence?: number;
    severity?: string;
    summary?: string;
    anomalies?: string[];
  };
  health?: {
    success_rate?: number;
    total?: number;
    failures?: number;
  };
}

export function StatusCard({ mlDecision, health }: StatusCardProps) {
  const decision = mlDecision?.decision || 'UNKNOWN';
  const confidence = mlDecision?.confidence || 0;
  const severity = mlDecision?.severity || 'UNKNOWN';
  const summary = mlDecision?.summary || 'No analysis available';
  const anomalies = mlDecision?.anomalies || [];

  const getDecisionColor = () => {
    if (decision === 'PROMOTE') return 'text-green-500';
    if (decision === 'ROLLBACK') return 'text-red-500';
    return 'text-yellow-500';
  };

  const getSeverityColor = () => {
    if (severity === 'OK') return 'text-green-500';
    if (severity === 'CRITICAL') return 'text-red-500';
    return 'text-yellow-500';
  };

  return (
    <div className="bg-card rounded-lg border p-6 space-y-4">
      <h2 className="text-2xl font-semibold">🧠 ML Canary Decision</h2>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Decision:</span>
          <span className={`font-bold text-lg ${getDecisionColor()}`}>
            {decision}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Confidence:</span>
          <span className="font-semibold">
            {(confidence * 100).toFixed(1)}%
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Severity:</span>
          <span className={`font-semibold ${getSeverityColor()}`}>
            {severity}
          </span>
        </div>
      </div>

      <div className="pt-4 border-t">
        <p className="text-sm text-muted-foreground mb-2">Summary:</p>
        <p className="text-sm">{summary}</p>
      </div>

      {anomalies.length > 0 && (
        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground mb-2">Anomalies:</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {anomalies.map((anomaly, i) => (
              <li key={i}>{anomaly}</li>
            ))}
          </ul>
        </div>
      )}

      {health && (
        <div className="pt-4 border-t">
          <h3 className="text-lg font-semibold mb-2">📊 Health Metrics</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Success Rate:</span>
              <span className="font-semibold">
                {((health.success_rate || 0) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total Checks:</span>
              <span className="font-semibold">{health.total || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Failures:</span>
              <span className="font-semibold text-red-500">
                {health.failures || 0}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
