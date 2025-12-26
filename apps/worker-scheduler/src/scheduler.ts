import { getMarketplaceSettings } from "./services/supabase.js";
import { scanMarketplace } from "./scanner.js";
import { requireEntitlementOrExit } from "./services/entitlements.js";
import { metrics } from "./metrics.js";

type PlanTier = "short" | "active" | "wide" | "admin";

type SchedulerCaps = {
  maxScansPerTick: number;
  maxScansPerMinute: number;
};

const EVENT_WINDOW_MS = 5 * 60_000;
const KILL_SWITCH_COOLDOWN_MS = 10 * 60_000;

const THRESHOLDS = {
  skipped_due_to_cap: 25,
  entitlement_denied: 10,
  unexpected_scan_error: 3,
};

let scansThisMinute = 0;
let minuteWindowStart = Date.now();

let capSkipEvents: number[] = [];
let entitlementDeniedEvents: number[] = [];
let scanErrorEvents: number[] = [];

let emergencyOffActive = false;
let emergencyOffActivatedAt = 0;

function resetMinuteWindowIfNeeded(now: number) {
  if (now - minuteWindowStart >= 60_000) {
    scansThisMinute = 0;
    minuteWindowStart = now;
  }
}

export function getSchedulerCapsForTier(planTier?: string): SchedulerCaps {
  switch (planTier) {
    case "active":
      return { maxScansPerTick: 2, maxScansPerMinute: 10 };
    case "wide":
      return { maxScansPerTick: 4, maxScansPerMinute: 20 };
    case "admin":
      return {
        maxScansPerTick: Number.POSITIVE_INFINITY,
        maxScansPerMinute: Number.POSITIVE_INFINITY,
      };
    case "short":
    default:
      return { maxScansPerTick: 1, maxScansPerMinute: 4 };
  }
}

function pruneEvents(events: number[], now: number) {
  return events.filter((ts) => now - ts <= EVENT_WINDOW_MS);
}

function maybeResetKillSwitch(now: number) {
  if (!emergencyOffActive) {
    return;
  }

  if (now - emergencyOffActivatedAt >= KILL_SWITCH_COOLDOWN_MS) {
    emergencyOffActive = false;
    emergencyOffActivatedAt = 0;
    capSkipEvents = [];
    entitlementDeniedEvents = [];
    scanErrorEvents = [];
    const guardState = globalThis as {
      __EMERGENCY_OFF_ACTIVE__?: boolean;
    };
    guardState.__EMERGENCY_OFF_ACTIVE__ = false;
    console.warn("[scheduler] emergency_off cleared after cooldown");
  }
}

function maybeActivateKillSwitch(now: number) {
  if (emergencyOffActive) {
    return;
  }

  capSkipEvents = pruneEvents(capSkipEvents, now);
  entitlementDeniedEvents = pruneEvents(entitlementDeniedEvents, now);
  scanErrorEvents = pruneEvents(scanErrorEvents, now);

  if (
    capSkipEvents.length >= THRESHOLDS.skipped_due_to_cap ||
    entitlementDeniedEvents.length >= THRESHOLDS.entitlement_denied ||
    scanErrorEvents.length >= THRESHOLDS.unexpected_scan_error
  ) {
    emergencyOffActive = true;
    emergencyOffActivatedAt = now;
    metrics.scheduler.kill_switch_activations += 1;
    const guardState = globalThis as {
      __EMERGENCY_OFF_ACTIVE__?: boolean;
    };
    guardState.__EMERGENCY_OFF_ACTIVE__ = true;
    console.error(
      "[scheduler] EMERGENCY OFF activated due to safety thresholds"
    );
  }
}

function recordCapSkip(now: number) {
  capSkipEvents = pruneEvents(capSkipEvents, now);
  capSkipEvents.push(now);
  metrics.scheduler.skipped_due_to_cap += 1;
  maybeActivateKillSwitch(now);
}

function recordEntitlementDenied(now: number) {
  entitlementDeniedEvents = pruneEvents(entitlementDeniedEvents, now);
  entitlementDeniedEvents.push(now);
  metrics.scheduler.entitlement_denied += 1;
  maybeActivateKillSwitch(now);
}

function recordUnexpectedScanError(now: number) {
  scanErrorEvents = pruneEvents(scanErrorEvents, now);
  scanErrorEvents.push(now);
  metrics.scheduler.unexpected_scan_error += 1;
  maybeActivateKillSwitch(now);
}

function shouldHaltForEmergencyOff(now: number, executionMode: ExecutionMode) {
  maybeResetKillSwitch(now);
  if (executionMode === "admin") {
    return false;
  }
  return emergencyOffActive || executionMode === "emergency_off";
}

type ExecutionMode = "off" | "admin" | "public" | "emergency_off";

type RunScheduledScanOptions = {
  executionMode?: ExecutionMode;
  marketplacesOverride?: string[];
  requireEntitlement?: typeof requireEntitlementOrExit;
  scanFn?: typeof scanMarketplace;
  now?: () => number;
};

export function __resetSchedulerStateForTests() {
  scansThisMinute = 0;
  minuteWindowStart = Date.now();
  capSkipEvents = [];
  entitlementDeniedEvents = [];
  scanErrorEvents = [];
  emergencyOffActive = false;
  emergencyOffActivatedAt = 0;
  metrics.scheduler.skipped_due_to_cap = 0;
  metrics.scheduler.entitlement_denied = 0;
  metrics.scheduler.unexpected_scan_error = 0;
  metrics.scheduler.kill_switch_activations = 0;
  const guardState = globalThis as {
    __EMERGENCY_OFF_ACTIVE__?: boolean;
  };
  guardState.__EMERGENCY_OFF_ACTIVE__ = false;
}

export async function runScheduledScan(options: RunScheduledScanOptions = {}) {
  console.log("Starting scheduled scan...");

  const executionMode =
    options.executionMode ??
    (process.env.EXECUTION_MODE as ExecutionMode | undefined) ??
    "off";

  if (executionMode === "off") {
    console.log("EXECUTION_MODE=off — skipping scheduled scan");
    return;
  }

  const now = options.now ?? Date.now;
  const requireEntitlement = options.requireEntitlement ?? requireEntitlementOrExit;
  const scanFn = options.scanFn ?? scanMarketplace;

  if (shouldHaltForEmergencyOff(now(), executionMode)) {
    console.error("[scheduler] execution_emergency_off — halting scans");
    return;
  }

  const marketplaces = options.marketplacesOverride
    ? options.marketplacesOverride.map((marketplace) => ({
        marketplace,
        enabled: true,
      }))
    : await getMarketplaceSettings();

  if (marketplaces.length === 0) {
    console.log("No enabled marketplaces found");
    return;
  }

  // Risk-tier aware scheduling: Sort by risk level (low risk first)
  const sortedMarketplaces = await Promise.all(
    marketplaces.map(async (m) => {
      try {
        const { getMarketplaceProfile } = await import(
          "@magnus-flipper-ai/marketplace-config"
        );
        const profile = getMarketplaceProfile(m.marketplace as any);
        return { ...m, riskLevel: profile.riskLevel };
      } catch {
        return { ...m, riskLevel: "medium" as const };
      }
    })
  );

  // Sort: low -> medium -> high -> critical
  const riskOrder: Record<string, number> = {
    low: 0,
    medium: 1,
    high: 2,
    critical: 3,
  };
  sortedMarketplaces.sort((a, b) => {
    return (riskOrder[a.riskLevel] || 1) - (riskOrder[b.riskLevel] || 1);
  });

  console.log(
    `Processing ${sortedMarketplaces.length} marketplaces (risk-tier sorted)`
  );

  let executed = 0;
  for (const marketplace of sortedMarketplaces) {
    const nowValue = now();
    if (shouldHaltForEmergencyOff(nowValue, executionMode)) {
      console.error("[scheduler] execution_emergency_off — halting scans");
      return;
    }

    resetMinuteWindowIfNeeded(nowValue);

    let caps: SchedulerCaps = getSchedulerCapsForTier("admin");
    if (executionMode === "public") {
      const entitlementUserId = process.env.WORKER_ENTITLEMENT_USER_ID;
      const entitlement = await requireEntitlement(
        entitlementUserId,
        marketplace.marketplace
      );

      if (!entitlement.ok) {
        recordEntitlementDenied(nowValue);
        if (shouldHaltForEmergencyOff(nowValue, executionMode)) {
          console.error("[scheduler] execution_emergency_off — halting scans");
          return;
        }
        console.warn(
          `Entitlement blocked for ${marketplace.marketplace}: ${entitlement.reason}`
        );
        continue;
      }

      caps = getSchedulerCapsForTier(entitlement.planTier);
    }

    if (scansThisMinute >= caps.maxScansPerMinute) {
      recordCapSkip(nowValue);
      console.warn(
        `[scheduler] minute cap reached (${caps.maxScansPerMinute}); stopping tick`
      );
      break;
    }

    if (executed >= caps.maxScansPerTick) {
      recordCapSkip(nowValue);
      console.warn(
        `[scheduler] cap reached (${caps.maxScansPerTick}); stopping tick`
      );
      break;
    }

    try {
      if (executionMode === "public") {
        const guardState = globalThis as {
          __ENTITLEMENT_CHECK_PASSED__?: boolean;
        };
        guardState.__ENTITLEMENT_CHECK_PASSED__ = true;
        try {
          await scanFn(marketplace.marketplace);
        } finally {
          guardState.__ENTITLEMENT_CHECK_PASSED__ = false;
        }
      } else {
        await scanFn(marketplace.marketplace);
      }
      executed += 1;
      scansThisMinute += 1;
    } catch (error) {
      recordUnexpectedScanError(nowValue);
      console.error(
        `[scheduler] unexpected scan error for ${marketplace.marketplace}:`,
        error
      );
      if (shouldHaltForEmergencyOff(nowValue, executionMode)) {
        console.error("[scheduler] execution_emergency_off — halting scans");
        return;
      }
    }
  }

  console.log("Scheduled scan complete");
}
