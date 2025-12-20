"use client";

export type MotionDebugType = "entry" | "hover" | "pulse" | "transition" | "other";
export type MotionDebugTier = "FREE" | "STARTER" | "PRO" | "ELITE" | "UNKNOWN";

export type MotionDebugInstance = {
  id: string;
  label: string;
  type: MotionDebugType;
  durationMs: number | null;
  tier: MotionDebugTier;
  repeat: "none" | "infinite";
  startedAt: number;
};

type MotionDebugState = {
  enabled: boolean;
  highlight: boolean;
};

const state: MotionDebugState = {
  enabled: false,
  highlight: false,
};

const active = new Map<string, MotionDebugInstance>();
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export const motionDebugStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getState(): MotionDebugState {
    return { ...state };
  },
  setEnabled(next: boolean) {
    state.enabled = Boolean(next);
    if (!state.enabled) active.clear();
    emit();
  },
  setHighlight(next: boolean) {
    state.highlight = Boolean(next);
    emit();
  },
  getActive(): MotionDebugInstance[] {
    return Array.from(active.values()).sort((a, b) => b.startedAt - a.startedAt);
  },
  start(instance: MotionDebugInstance) {
    if (!state.enabled) return;
    active.set(instance.id, instance);
    emit();
  },
  stop(id: string) {
    if (!state.enabled) return;
    if (!active.has(id)) return;
    active.delete(id);
    emit();
  },
};

