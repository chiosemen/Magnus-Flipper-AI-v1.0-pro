interface MLResponse {
  decision: 'PROMOTE' | 'ROLLBACK' | 'DEGRADED';
  confidence: number;
  severity: 'OK' | 'DEGRADED' | 'CRITICAL';
  summary: string;
  anomalies: string[];
}

export async function queryMLProvider(
  provider: 'openai' | 'deepseek' | 'claude',
  logs: string,
  apiKey: string
): Promise<MLResponse | null> {
  const prompt = `Analyze these container application logs from a canary deployment. Detect anomalies and output JSON:
{
  "decision": "PROMOTE" | "ROLLBACK" | "DEGRADED",
  "confidence": 0.0-1.0,
  "severity": "OK" | "DEGRADED" | "CRITICAL",
  "summary": "Brief summary",
  "anomalies": ["list of anomalies"]
}

Logs:
${logs.substring(0, 10000)}`;

  try {
    if (provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: 'You are an expert SRE. Output strict JSON only.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.0,
        }),
      });

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '{}';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      return JSON.parse(jsonMatch ? jsonMatch[0] : content);
    }

    if (provider === 'deepseek') {
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: 'You are an expert SRE. Output strict JSON only.' },
            { role: 'user', content: prompt },
          ],
          temperature: 0.0,
        }),
      });

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '{}';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      return JSON.parse(jsonMatch ? jsonMatch[0] : content);
    }

    if (provider === 'claude') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1000,
          messages: [
            { role: 'user', content: prompt },
          ],
        }),
      });

      const data = await response.json();
      const content = data.content[0]?.text || '{}';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      return JSON.parse(jsonMatch ? jsonMatch[0] : content);
    }

    return null;
  } catch (error) {
    console.error(`Error querying ${provider}:`, error);
    return null;
  }
}

export async function mlCanaryCommittee(logs: string): Promise<MLResponse> {
  const providers = [
    { name: 'openai' as const, key: process.env.OPENAI_API_KEY },
    { name: 'deepseek' as const, key: process.env.DEEPSEEK_API_KEY },
    { name: 'claude' as const, key: process.env.CLAUDE_API_KEY },
  ].filter((p) => p.key);

  const results = await Promise.all(
    providers.map((p) => queryMLProvider(p.name, logs, p.key!))
  );

  const validResults = results.filter((r) => r !== null) as MLResponse[];

  if (validResults.length === 0) {
    return {
      decision: 'DEGRADED',
      confidence: 0.0,
      severity: 'UNKNOWN',
      summary: 'No ML providers available',
      anomalies: [],
    };
  }

  // Majority vote on decision
  const decisions = validResults.map((r) => r.decision);
  const decisionCounts = decisions.reduce((acc, d) => {
    acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const majorityDecision = Object.entries(decisionCounts).sort(
    (a, b) => b[1] - a[1]
  )[0][0] as 'PROMOTE' | 'ROLLBACK' | 'DEGRADED';

  // Average confidence
  const avgConfidence =
    validResults.reduce((sum, r) => sum + r.confidence, 0) / validResults.length;

  // Most severe severity
  const severities = validResults.map((r) => r.severity);
  const severityOrder = { CRITICAL: 3, DEGRADED: 2, OK: 1 };
  const maxSeverity = severities.sort(
    (a, b) => severityOrder[b as keyof typeof severityOrder] - severityOrder[a as keyof typeof severityOrder]
  )[0];

  // Combine summaries and anomalies
  const summary = validResults
    .map((r) => r.summary)
    .filter(Boolean)
    .join('; ');
  const allAnomalies = validResults.flatMap((r) => r.anomalies);

  return {
    decision: majorityDecision,
    confidence: avgConfidence,
    severity: maxSeverity as 'OK' | 'DEGRADED' | 'CRITICAL',
    summary: summary || 'ML committee analysis complete',
    anomalies: [...new Set(allAnomalies)],
  };
}
