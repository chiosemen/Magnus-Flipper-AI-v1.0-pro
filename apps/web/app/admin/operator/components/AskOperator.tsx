'use client';

/**
 * Ask Operator Component
 * Allows admins to ask the Operator Agent questions
 */

import { useState } from 'react';
import { Card } from '@/marketing-swoopa/components/ui/card';
import { Button } from '@/marketing-swoopa/components/ui/button';
import { Textarea } from '@/marketing-swoopa/components/ui/textarea';
import { Input } from '@/marketing-swoopa/components/ui/input';
import { Label } from '@/marketing-swoopa/components/ui/label';
import { Badge } from '@/marketing-swoopa/components/ui/badge';
import { Alert, AlertDescription } from '@/marketing-swoopa/components/ui/alert';

interface OperatorResponse {
  severity: string;
  confidence: number;
  diagnosis: string;
  evidence: {
    anomalies: any[];
    runs: any[];
    decisions: any[];
    kb_citations: string[];
  };
  reasoning_trace: {
    signals_used: string[];
    discarded_signals: string[];
    hypotheses_considered: string[];
    false_positive_risk: string;
  };
  recommendations: string[];
  health_snapshot?: {
    marketplace: string;
    score: number;
    trend: string;
    dominant_failure_mode?: string;
  };
}

export function AskOperator() {
  const [question, setQuestion] = useState('');
  const [marketplace, setMarketplace] = useState('');
  const [timeWindow, setTimeWindow] = useState('24');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<OperatorResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAsk = async () => {
    if (!question.trim()) {
      setError('Please enter a question');
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch('/api/operator/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          marketplace: marketplace || undefined,
          timeWindowHours: parseInt(timeWindow),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to get response');
      }

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold mb-4">Ask Operator Agent</h2>
        </div>

        {/* Input Form */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="question">Question</Label>
            <Textarea
              id="question"
              placeholder="Why did craigslist return zero results?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={3}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="marketplace">Marketplace (optional)</Label>
              <Input
                id="marketplace"
                placeholder="e.g., craigslist, facebook"
                value={marketplace}
                onChange={(e) => setMarketplace(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="timeWindow">Time Window (hours)</Label>
              <select
                id="timeWindow"
                value={timeWindow}
                onChange={(e) => setTimeWindow(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="1">1 hour</option>
                <option value="6">6 hours</option>
                <option value="24">24 hours</option>
                <option value="72">3 days</option>
              </select>
            </div>
          </div>

          <Button onClick={handleAsk} disabled={loading} className="w-full md:w-auto">
            {loading ? 'Asking...' : 'Ask Operator'}
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Response Display */}
        {response && (
          <div className="space-y-4 border-t pt-4">
            {/* Header with severity and confidence */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant={
                  response.severity === 'critical'
                    ? 'destructive'
                    : response.severity === 'high'
                    ? 'destructive'
                    : response.severity === 'medium'
                    ? 'default'
                    : 'secondary'
                }
              >
                {response.severity.toUpperCase()}
              </Badge>
              <Badge variant="outline">
                Confidence: {(response.confidence * 100).toFixed(0)}%
              </Badge>
              {response.confidence < 0.6 && (
                <Badge variant="destructive">
                  ⚠️ Low confidence — insufficient telemetry
                </Badge>
              )}
            </div>

            {/* Diagnosis */}
            <div>
              <h3 className="font-semibold mb-2">Diagnosis</h3>
              <p className="text-sm text-muted-foreground">{response.diagnosis}</p>
            </div>

            {/* Health Snapshot */}
            {response.health_snapshot && (
              <div>
                <h3 className="font-semibold mb-2">Health Snapshot</h3>
                <div className="bg-muted p-3 rounded-md space-y-1 text-sm">
                  <p>
                    <span className="font-medium">Marketplace:</span>{' '}
                    {response.health_snapshot.marketplace}
                  </p>
                  <p>
                    <span className="font-medium">Score:</span>{' '}
                    {response.health_snapshot.score}/100
                  </p>
                  <p>
                    <span className="font-medium">Trend:</span>{' '}
                    {response.health_snapshot.trend}
                  </p>
                  {response.health_snapshot.dominant_failure_mode && (
                    <p>
                      <span className="font-medium">Dominant Failure:</span>{' '}
                      {response.health_snapshot.dominant_failure_mode}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {response.recommendations && response.recommendations.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Recommendations</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {response.recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Evidence Summary */}
            <div>
              <h3 className="font-semibold mb-2">Evidence</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <div className="bg-muted p-2 rounded">
                  <div className="font-medium">Anomalies</div>
                  <div className="text-2xl">{response.evidence.anomalies.length}</div>
                </div>
                <div className="bg-muted p-2 rounded">
                  <div className="font-medium">Runs</div>
                  <div className="text-2xl">{response.evidence.runs.length}</div>
                </div>
                <div className="bg-muted p-2 rounded">
                  <div className="font-medium">Decisions</div>
                  <div className="text-2xl">{response.evidence.decisions.length}</div>
                </div>
                <div className="bg-muted p-2 rounded">
                  <div className="font-medium">KB Citations</div>
                  <div className="text-2xl">{response.evidence.kb_citations.length}</div>
                </div>
              </div>
            </div>

            {/* Reasoning Trace */}
            <details className="text-sm">
              <summary className="font-semibold cursor-pointer">Reasoning Trace</summary>
              <div className="mt-2 space-y-2 bg-muted p-3 rounded-md">
                <div>
                  <span className="font-medium">Signals Used:</span>{' '}
                  {response.reasoning_trace.signals_used.join(', ') || 'None'}
                </div>
                <div>
                  <span className="font-medium">Hypotheses Considered:</span>{' '}
                  {response.reasoning_trace.hypotheses_considered.join(', ') || 'None'}
                </div>
                <div>
                  <span className="font-medium">False Positive Risk:</span>{' '}
                  {response.reasoning_trace.false_positive_risk}
                </div>
              </div>
            </details>
          </div>
        )}
      </div>
    </Card>
  );
}

