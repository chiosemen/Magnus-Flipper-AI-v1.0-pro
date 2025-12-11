/**
 * Adaptive Throttling Guardrails
 * Safety limits and enforcement for adaptive throttling
 */

import { MarketplaceProfile } from '@magnus-flipper-ai/marketplace-config';

export interface ThrottleGuardrail {
  minMultiplier: number; // Minimum throttle multiplier (e.g., 0.3 = 30% of normal rate)
  maxMultiplier: number; // Maximum throttle multiplier (e.g., 1.5 = 150% of normal rate)
  emergencyThreshold: number; // Success rate threshold to trigger emergency mode
  emergencyMultiplier: number; // Multiplier when in emergency mode
  recoveryThreshold: number; // Success rate threshold to exit emergency mode
  cooldownPeriod: number; // Seconds to wait before increasing rate after recovery
  latencyP95ThresholdMs: number; // P95 latency threshold to clamp multiplier
  errorRateThreshold: number; // Error rate threshold to clamp multiplier
}

export interface GuardrailViolation {
  type: 'min' | 'max' | 'emergency' | 'recovery';
  message: string;
  recommendedMultiplier: number;
}

/**
 * Default guardrails by risk level
 */
const DEFAULT_GUARDRAILS: Record<string, ThrottleGuardrail> = {
  low: {
    minMultiplier: 0.5,
    maxMultiplier: 1.5,
    emergencyThreshold: 0.5, // 50% success rate
    emergencyMultiplier: 0.3,
    recoveryThreshold: 0.8, // 80% success rate
    cooldownPeriod: 300, // 5 minutes
    latencyP95ThresholdMs: 1500,
    errorRateThreshold: 0.15,
  },
  medium: {
    minMultiplier: 0.4,
    maxMultiplier: 1.3,
    emergencyThreshold: 0.6, // 60% success rate
    emergencyMultiplier: 0.25,
    recoveryThreshold: 0.85, // 85% success rate
    cooldownPeriod: 600, // 10 minutes
    latencyP95ThresholdMs: 2000,
    errorRateThreshold: 0.12,
  },
  high: {
    minMultiplier: 0.3,
    maxMultiplier: 1.2,
    emergencyThreshold: 0.7, // 70% success rate
    emergencyMultiplier: 0.2,
    recoveryThreshold: 0.9, // 90% success rate
    cooldownPeriod: 900, // 15 minutes
    latencyP95ThresholdMs: 2500,
    errorRateThreshold: 0.1,
  },
  critical: {
    minMultiplier: 0.2,
    maxMultiplier: 1.1,
    emergencyThreshold: 0.75, // 75% success rate
    emergencyMultiplier: 0.15,
    recoveryThreshold: 0.95, // 95% success rate
    cooldownPeriod: 1800, // 30 minutes
    latencyP95ThresholdMs: 3000,
    errorRateThreshold: 0.08,
  },
};

/**
 * Get guardrails for a marketplace profile
 */
export function getGuardrails(profile: MarketplaceProfile): ThrottleGuardrail {
  const riskLevel = profile.riskLevel.toLowerCase();
  return DEFAULT_GUARDRAILS[riskLevel] || DEFAULT_GUARDRAILS.medium;
}

/**
 * Apply guardrails to throttle multiplier
 * Returns clamped multiplier and any violations
 */
export function applyGuardrails(
  profile: MarketplaceProfile,
  proposedMultiplier: number,
  successRate: number,
  metrics: {
    p95LatencyMs?: number;
    errorRate?: number;
  } = {},
  isEmergencyMode: boolean = false
): {
  multiplier: number;
  violations: GuardrailViolation[];
  emergencyMode: boolean;
} {
  const guardrails = getGuardrails(profile);
  const violations: GuardrailViolation[] = [];
  let multiplier = proposedMultiplier;
  let emergencyMode = isEmergencyMode;

  // Check emergency threshold (success rate)
  if (successRate < guardrails.emergencyThreshold && !emergencyMode) {
    emergencyMode = true;
    multiplier = guardrails.emergencyMultiplier;
    violations.push({
      type: 'emergency',
      message: `Success rate ${(successRate * 100).toFixed(1)}% below emergency threshold ${(guardrails.emergencyThreshold * 100).toFixed(1)}%`,
      recommendedMultiplier: guardrails.emergencyMultiplier,
    });
  }

  // Check recovery threshold
  if (emergencyMode && successRate >= guardrails.recoveryThreshold) {
    emergencyMode = false;
    violations.push({
      type: 'recovery',
      message: `Success rate ${(successRate * 100).toFixed(1)}% above recovery threshold ${(guardrails.recoveryThreshold * 100).toFixed(1)}%`,
      recommendedMultiplier: guardrails.minMultiplier,
    });
  }

  // Latency guardrail
  if (metrics.p95LatencyMs && metrics.p95LatencyMs > guardrails.latencyP95ThresholdMs) {
    const clamped = Math.max(guardrails.minMultiplier, multiplier * 0.85);
    violations.push({
      type: 'max',
      message: `P95 latency ${metrics.p95LatencyMs}ms above threshold ${guardrails.latencyP95ThresholdMs}ms`,
      recommendedMultiplier: clamped,
    });
    multiplier = clamped;
  }

  // Error rate guardrail
  if (metrics.errorRate && metrics.errorRate > guardrails.errorRateThreshold) {
    const clamped = Math.max(guardrails.minMultiplier, multiplier * 0.8);
    violations.push({
      type: 'max',
      message: `Error rate ${(metrics.errorRate * 100).toFixed(1)}% above threshold ${(guardrails.errorRateThreshold * 100).toFixed(1)}%`,
      recommendedMultiplier: clamped,
    });
    multiplier = clamped;
  }

  // Apply min/max bounds
  if (multiplier < guardrails.minMultiplier) {
    violations.push({
      type: 'min',
      message: `Multiplier ${multiplier.toFixed(2)} below minimum ${guardrails.minMultiplier}`,
      recommendedMultiplier: guardrails.minMultiplier,
    });
    multiplier = guardrails.minMultiplier;
  }

  if (multiplier > guardrails.maxMultiplier) {
    violations.push({
      type: 'max',
      message: `Multiplier ${multiplier.toFixed(2)} above maximum ${guardrails.maxMultiplier}`,
      recommendedMultiplier: guardrails.maxMultiplier,
    });
    multiplier = guardrails.maxMultiplier;
  }

  return {
    multiplier: Math.round(multiplier * 1000) / 1000, // Round to 3 decimals
    violations,
    emergencyMode,
  };
}

/**
 * Calculate safe throttle multiplier with guardrails
 */
export function calculateSafeThrottleMultiplier(
  profile: MarketplaceProfile,
  baseMultiplier: number,
  successRate: number,
  metrics: {
    p95LatencyMs?: number;
    errorRate?: number;
  } = {},
  isEmergencyMode: boolean = false
): number {
  const result = applyGuardrails(profile, baseMultiplier, successRate, metrics, isEmergencyMode);
  return result.multiplier;
}

/**
 * Check if rate increase is safe (after cooldown)
 */
export function canIncreaseRate(
  profile: MarketplaceProfile,
  lastIncreaseTime: number,
  currentSuccessRate: number
): boolean {
  const guardrails = getGuardrails(profile);
  const timeSinceLastIncrease = (Date.now() - lastIncreaseTime) / 1000;

  // Must wait for cooldown period
  if (timeSinceLastIncrease < guardrails.cooldownPeriod) {
    return false;
  }

  // Success rate must be above recovery threshold
  if (currentSuccessRate < guardrails.recoveryThreshold) {
    return false;
  }

  return true;
}
