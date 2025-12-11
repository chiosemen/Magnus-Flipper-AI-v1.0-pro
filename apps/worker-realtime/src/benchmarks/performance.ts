/**
 * Performance Benchmarks
 * CPU efficiency, throughput, and latency metrics
 */

import { getCpuUsage, getMemoryUsage } from '../services/metrics';
import { getFingerprintStats } from '@magnus-flipper-ai/compliance-shield/fingerprintManager';

export interface BenchmarkResult {
  timestamp: number;
  cpuUsage: number;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  fingerprintStats: Record<string, { count: number; avgUseCount: number }>;
}

/**
 * Run performance benchmark
 */
export function runBenchmark(): BenchmarkResult {
  return {
    timestamp: Date.now(),
    cpuUsage: getCpuUsage(),
    memoryUsage: getMemoryUsage(),
    fingerprintStats: getFingerprintStats(),
  };
}

/**
 * Compare two benchmark results
 */
export function compareBenchmarks(
  before: BenchmarkResult,
  after: BenchmarkResult
): {
  cpuDelta: number;
  memoryDelta: number;
  duration: number;
} {
  return {
    cpuDelta: after.cpuUsage - before.cpuUsage,
    memoryDelta: after.memoryUsage.heapUsed - before.memoryUsage.heapUsed,
    duration: after.timestamp - before.timestamp,
  };
}

/**
 * Check if system is ready for scraping (CPU and memory thresholds)
 */
export function isSystemReady(): { ready: boolean; reasons: string[] } {
  const cpuUsage = getCpuUsage();
  const memUsage = getMemoryUsage();
  const reasons: string[] = [];

  if (cpuUsage > 0.9) {
    reasons.push(`CPU usage too high: ${(cpuUsage * 100).toFixed(1)}%`);
  }

  if (memUsage.heapUsed > 0.9 * memUsage.heapTotal) {
    reasons.push(`Memory usage too high: ${(memUsage.heapUsed / 1024 / 1024).toFixed(1)}MB / ${(memUsage.heapTotal / 1024 / 1024).toFixed(1)}MB`);
  }

  return {
    ready: reasons.length === 0,
    reasons,
  };
}
