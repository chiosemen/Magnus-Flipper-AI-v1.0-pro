import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  __resetSchedulerStateForTests,
  runScheduledScan,
} from "../scheduler.js";
import { metrics } from "../metrics.js";
import { scanMarketplace } from "../scanner.js";

type GateResult = { ok: true; planTier?: string } | { ok: false; reason: string };

const marketplaces = ["fb", "vinted", "gumtree"];

beforeEach(() => {
  process.env.EXECUTION_MODE = "public";
  __resetSchedulerStateForTests();
});

test("enforces tier caps (short)", async () => {
  const events: string[] = [];

  const requireEntitlement = async (
    _userId: string | undefined,
    marketplace: string
  ): Promise<GateResult> => {
    events.push(`entitlement:${marketplace}`);
    return { ok: true, planTier: "short" };
  };

  const scanFn = async (marketplace: string) => {
    events.push(`scan:${marketplace}`);
  };

  await runScheduledScan({
    executionMode: "public",
    marketplacesOverride: marketplaces,
    requireEntitlement,
    scanFn,
    now: () => 1,
  });

  assert.deepEqual(events, [
    "entitlement:fb",
    "scan:fb",
    "entitlement:vinted",
  ]);
  assert.equal(metrics.scheduler.skipped_due_to_cap, 1);
});

test("enforces tier caps (wide)", async () => {
  const scans: string[] = [];

  const requireEntitlement = async (): Promise<GateResult> => {
    return { ok: true, planTier: "wide" };
  };

  const scanFn = async (marketplace: string) => {
    scans.push(marketplace);
  };

  await runScheduledScan({
    executionMode: "public",
    marketplacesOverride: marketplaces,
    requireEntitlement,
    scanFn,
    now: () => 1,
  });

  assert.deepEqual(scans, ["fb", "vinted", "gumtree"]);
});

test("admin tier bypasses caps", async () => {
  const scans: string[] = [];

  const requireEntitlement = async (): Promise<GateResult> => {
    return { ok: true, planTier: "admin" };
  };

  const scanFn = async (marketplace: string) => {
    scans.push(marketplace);
  };

  await runScheduledScan({
    executionMode: "public",
    marketplacesOverride: Array.from({ length: 8 }, (_, i) => `m${i}`),
    requireEntitlement,
    scanFn,
    now: () => 1,
  });

  assert.equal(scans.length, 8);
});

test("skips scan when entitlement fails", async () => {
  let callCount = 0;
  const scans: string[] = [];

  const requireEntitlement = async (): Promise<GateResult> => {
    callCount += 1;
    if (callCount === 1) {
      return { ok: false, reason: "no_credits" };
    }
    return { ok: true, planTier: "wide" };
  };

  const scanFn = async (marketplace: string) => {
    scans.push(marketplace);
  };

  await runScheduledScan({
    executionMode: "public",
    marketplacesOverride: ["fb", "vinted"],
    requireEntitlement,
    scanFn,
    now: () => 1,
  });

  assert.deepEqual(scans, ["vinted"]);
  assert.equal(metrics.scheduler.entitlement_denied, 1);
});

test("kill-switch triggers and blocks scans", async () => {
  const scanFn = async () => {};

  const requireEntitlement = async (): Promise<GateResult> => {
    return { ok: true, planTier: "short" };
  };

  for (let i = 0; i < 25; i += 1) {
    await runScheduledScan({
      executionMode: "public",
      marketplacesOverride: ["fb", "vinted"],
      requireEntitlement,
      scanFn,
      now: () => 1,
    });
  }

  assert.equal(metrics.scheduler.kill_switch_activations, 1);

  const blockedScans: string[] = [];
  const blockingScanFn = async (marketplace: string) => {
    blockedScans.push(marketplace);
  };

  await runScheduledScan({
    executionMode: "public",
    marketplacesOverride: ["fb"],
    requireEntitlement,
    scanFn: blockingScanFn,
    now: () => 1,
  });

  assert.deepEqual(blockedScans, []);
});

test("admin override re-enables execution during emergency_off", async () => {
  const requireEntitlement = async (): Promise<GateResult> => {
    return { ok: true, planTier: "short" };
  };

  for (let i = 0; i < 25; i += 1) {
    await runScheduledScan({
      executionMode: "public",
      marketplacesOverride: ["fb", "vinted"],
      requireEntitlement,
      scanFn: async () => {},
      now: () => 1,
    });
  }

  const scans: string[] = [];
  await runScheduledScan({
    executionMode: "admin",
    marketplacesOverride: ["fb", "vinted"],
    scanFn: async (marketplace: string) => {
      scans.push(marketplace);
    },
    now: () => 1,
  });

  assert.deepEqual(scans, ["fb", "vinted"]);
});

test("guard allows scan only after entitlement", async () => {
  const requireEntitlement = async (): Promise<GateResult> => {
    return { ok: true, planTier: "short" };
  };

  await assert.doesNotReject(
    runScheduledScan({
      executionMode: "public",
      marketplacesOverride: ["fb"],
      requireEntitlement,
      now: () => 1,
    })
  );
});

test("guard blocks scan without entitlement in public mode", async () => {
  process.env.EXECUTION_MODE = "public";
  const guardState = globalThis as {
    __ENTITLEMENT_CHECK_PASSED__?: boolean;
    __EMERGENCY_OFF_ACTIVE__?: boolean;
  };
  guardState.__ENTITLEMENT_CHECK_PASSED__ = false;
  guardState.__EMERGENCY_OFF_ACTIVE__ = false;

  await assert.rejects(
    () => scanMarketplace("fb"),
    /entitlement check/
  );
});
