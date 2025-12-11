/**
 * Readiness Checks & Health Diagnostics
 * Validates scraper configuration and runtime health
 */

import { getMarketplaceProfile, MarketplaceId } from '@magnus-flipper-ai/marketplace-config';
import { getCurrentBackoffSeconds } from '@magnus-flipper-ai/rate-limiter';
import { validateCompliance, getComplianceConstraints } from '@magnus-flipper-ai/compliance-shield';
import { getCpuUsage, getMemoryUsage } from './metrics';

export interface ReadinessCheck {
  marketplace: string;
  status: 'ready' | 'degraded' | 'blocked';
  checks: {
    profile: { passed: boolean; message: string };
    compliance: { passed: boolean; message: string };
    backoff: { passed: boolean; message: string; backoffSeconds?: number };
    resources: { passed: boolean; message: string; cpuUsage?: number; memoryUsage?: number };
  };
  recommendations: string[];
}

/**
 * Perform comprehensive readiness check for a marketplace
 */
export async function checkMarketplaceReadiness(
  marketplaceName: string,
  dailyRequestCount: number = 0,
  hasProxy: boolean = false,
  hasSession: boolean = false
): Promise<ReadinessCheck> {
  const checks: ReadinessCheck['checks'] = {
    profile: { passed: false, message: '' },
    compliance: { passed: false, message: '' },
    backoff: { passed: false, message: '' },
    resources: { passed: false, message: '' },
  };
  const recommendations: string[] = [];
  let overallStatus: 'ready' | 'degraded' | 'blocked' = 'ready';

  // Check 1: Profile exists and is valid
  try {
    const profile = getMarketplaceProfile(marketplaceName as MarketplaceId);
    checks.profile = {
      passed: true,
      message: `Profile loaded: ${profile.displayName} (risk: ${profile.riskLevel})`,
    };

    // Check 2: Compliance validation
    const compliance = validateCompliance(profile, dailyRequestCount, hasProxy, hasSession);
    if (compliance.compliant) {
      checks.compliance = {
        passed: true,
        message: 'Compliance check passed',
      };
    } else {
      checks.compliance = {
        passed: false,
        message: compliance.reason || 'Compliance check failed',
      };
      overallStatus = 'blocked';
      recommendations.push(`Fix compliance issue: ${compliance.reason}`);
    }

    // Check 3: Backoff status
    const backoffSeconds = await getCurrentBackoffSeconds({
      marketplace: marketplaceName as MarketplaceId,
      ip: undefined,
      tier: 'STARTER',
    });

    const baseInterval = profile.recommendedPingIntervalSeconds;
    if (backoffSeconds > baseInterval) {
      checks.backoff = {
        passed: false,
        message: `In backoff: ${backoffSeconds}s (base: ${baseInterval}s)`,
        backoffSeconds,
      };
      if (overallStatus === 'ready') overallStatus = 'degraded';
      recommendations.push(`Wait for backoff to expire (${Math.ceil((backoffSeconds - baseInterval) / 60)} minutes remaining)`);
    } else {
      checks.backoff = {
        passed: true,
        message: `No active backoff (interval: ${baseInterval}s)`,
        backoffSeconds,
      };
    }

    // Check 4: Resource availability
    const cpuUsage = getCpuUsage();
    const memUsage = getMemoryUsage();
    const memUsageMB = memUsage.heapUsed / 1024 / 1024;

    // Thresholds: CPU < 80%, Memory < 1GB
    const cpuOk = cpuUsage < 80;
    const memOk = memUsageMB < 1024;

    if (cpuOk && memOk) {
      checks.resources = {
        passed: true,
        message: `Resources OK (CPU: ${cpuUsage.toFixed(1)}%, Memory: ${memUsageMB.toFixed(1)}MB)`,
        cpuUsage,
        memoryUsage: memUsageMB,
      };
    } else {
      checks.resources = {
        passed: false,
        message: `Resource pressure (CPU: ${cpuUsage.toFixed(1)}%, Memory: ${memUsageMB.toFixed(1)}MB)`,
        cpuUsage,
        memoryUsage: memUsageMB,
      };
      if (overallStatus === 'ready') overallStatus = 'degraded';
      if (!cpuOk) recommendations.push('CPU usage high - consider reducing concurrency');
      if (!memOk) recommendations.push('Memory usage high - consider batch size reduction');
    }

    // Additional recommendations based on profile
    if (profile.riskLevel === 'high' || profile.riskLevel === 'critical') {
      if (!hasProxy && profile.requiresProxyRotation) {
        recommendations.push('High-risk marketplace requires proxy rotation');
      }
      if (!hasSession && profile.requiresCookieSession) {
        recommendations.push('High-risk marketplace requires session management');
      }
    }

    if (profile.jsChallengeRisk === 'high') {
      recommendations.push('High JS challenge risk - ensure browser fingerprinting is enabled');
    }

  } catch (error) {
    checks.profile = {
      passed: false,
      message: `Profile error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
    overallStatus = 'blocked';
    recommendations.push('Fix marketplace profile configuration');
  }

  return {
    marketplace: marketplaceName,
    status: overallStatus,
    checks,
    recommendations,
  };
}

/**
 * Check all marketplaces readiness
 */
export async function checkAllMarketplacesReadiness(
  marketplaces: string[],
  dailyCounts: Map<string, number> = new Map(),
  proxyAvailable: boolean = false,
  sessionAvailable: boolean = false
): Promise<ReadinessCheck[]> {
  const results = await Promise.all(
    marketplaces.map((marketplace) =>
      checkMarketplaceReadiness(
        marketplace,
        dailyCounts.get(marketplace) || 0,
        proxyAvailable,
        sessionAvailable
      )
    )
  );

  return results;
}

/**
 * Generate readiness report
 */
export function generateReadinessReport(checks: ReadinessCheck[]): string {
  const ready = checks.filter((c) => c.status === 'ready').length;
  const degraded = checks.filter((c) => c.status === 'degraded').length;
  const blocked = checks.filter((c) => c.status === 'blocked').length;

  let report = `\n=== Scraper Readiness Report ===\n\n`;
  report += `Summary: ${ready} ready, ${degraded} degraded, ${blocked} blocked\n\n`;

  for (const check of checks) {
    const statusIcon = {
      ready: '✅',
      degraded: '⚠️',
      blocked: '❌',
    }[check.status];

    report += `${statusIcon} ${check.marketplace.toUpperCase()} - ${check.status.toUpperCase()}\n`;
    report += `  Profile: ${check.checks.profile.passed ? '✓' : '✗'} ${check.checks.profile.message}\n`;
    report += `  Compliance: ${check.checks.compliance.passed ? '✓' : '✗'} ${check.checks.compliance.message}\n`;
    report += `  Backoff: ${check.checks.backoff.passed ? '✓' : '✗'} ${check.checks.backoff.message}\n`;
    report += `  Resources: ${check.checks.resources.passed ? '✓' : '✗'} ${check.checks.resources.message}\n`;

    if (check.recommendations.length > 0) {
      report += `  Recommendations:\n`;
      for (const rec of check.recommendations) {
        report += `    - ${rec}\n`;
      }
    }
    report += `\n`;
  }

  return report;
}
