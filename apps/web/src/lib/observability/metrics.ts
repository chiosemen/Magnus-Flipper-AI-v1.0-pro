/**
 * Metrics Collection Layer
 * In-memory metrics storage for performance and error tracking
 */

interface CounterMetric {
  name: string;
  count: number;
  lastUpdated: number;
}

interface LatencyMetric {
  name: string;
  values: number[];
  count: number;
  sum: number;
  min: number;
  max: number;
  lastUpdated: number;
}

interface GaugeMetric {
  name: string;
  value: number;
  lastUpdated: number;
}

// In-memory metric storage
const counters = new Map<string, CounterMetric>();
const latencies = new Map<string, LatencyMetric>();
const gauges = new Map<string, GaugeMetric>();

// Maximum number of latency samples to keep per metric
const MAX_LATENCY_SAMPLES = 1000;

/**
 * Increment a counter metric
 */
export function incrementCounter(name: string, value: number = 1): void {
  try {
    const existing = counters.get(name);
    
    if (existing) {
      existing.count += value;
      existing.lastUpdated = Date.now();
    } else {
      counters.set(name, {
        name,
        count: value,
        lastUpdated: Date.now(),
      });
    }
  } catch (error) {
    // Fail-safe: never crash on metrics errors
    console.error(`[METRICS ERROR] Failed to increment counter: ${name}`, error);
  }
}

/**
 * Record a latency measurement
 */
export function recordLatency(name: string, ms: number): void {
  try {
    const existing = latencies.get(name);
    
    if (existing) {
      // Add to values array (keep only recent samples)
      existing.values.push(ms);
      if (existing.values.length > MAX_LATENCY_SAMPLES) {
        existing.values.shift(); // Remove oldest
      }
      
      existing.count++;
      existing.sum += ms;
      existing.min = Math.min(existing.min, ms);
      existing.max = Math.max(existing.max, ms);
      existing.lastUpdated = Date.now();
    } else {
      latencies.set(name, {
        name,
        values: [ms],
        count: 1,
        sum: ms,
        min: ms,
        max: ms,
        lastUpdated: Date.now(),
      });
    }
  } catch (error) {
    // Fail-safe: never crash on metrics errors
    console.error(`[METRICS ERROR] Failed to record latency: ${name}`, error);
  }
}

/**
 * Record a gauge value
 */
export function recordGauge(name: string, value: number): void {
  try {
    gauges.set(name, {
      name,
      value,
      lastUpdated: Date.now(),
    });
  } catch (error) {
    // Fail-safe: never crash on metrics errors
    console.error(`[METRICS ERROR] Failed to record gauge: ${name}`, error);
  }
}

/**
 * Get counter value
 */
export function getCounter(name: string): number {
  const metric = counters.get(name);
  return metric?.count || 0;
}

/**
 * Get latency statistics
 */
export function getLatencyStats(name: string): {
  count: number;
  avg: number;
  min: number;
  max: number;
  p50: number;
  p95: number;
  p99: number;
} | null {
  const metric = latencies.get(name);
  
  if (!metric || metric.values.length === 0) {
    return null;
  }
  
  // Calculate percentiles
  const sorted = [...metric.values].sort((a, b) => a - b);
  const p50 = sorted[Math.floor(sorted.length * 0.5)] || 0;
  const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
  const p99 = sorted[Math.floor(sorted.length * 0.99)] || 0;
  
  return {
    count: metric.count,
    avg: metric.sum / metric.count,
    min: metric.min,
    max: metric.max,
    p50,
    p95,
    p99,
  };
}

/**
 * Get gauge value
 */
export function getGauge(name: string): number | null {
  const metric = gauges.get(name);
  return metric?.value ?? null;
}

/**
 * Get all metrics (for telemetry endpoint)
 */
export function getAllMetrics(): {
  counters: Record<string, number>;
  latencies: Record<string, ReturnType<typeof getLatencyStats>>;
  gauges: Record<string, number>;
} {
  const counterData: Record<string, number> = {};
  const latencyData: Record<string, ReturnType<typeof getLatencyStats>> = {};
  const gaugeData: Record<string, number> = {};
  
  for (const [name] of counters) {
    counterData[name] = getCounter(name);
  }
  
  for (const [name] of latencies) {
    const stats = getLatencyStats(name);
    if (stats) {
      latencyData[name] = stats;
    }
  }
  
  for (const [name] of gauges) {
    const value = getGauge(name);
    if (value !== null) {
      gaugeData[name] = value;
    }
  }
  
  return {
    counters: counterData,
    latencies: latencyData,
    gauges: gaugeData,
  };
}

/**
 * Reset all metrics (useful for testing)
 */
export function resetMetrics(): void {
  counters.clear();
  latencies.clear();
  gauges.clear();
}

