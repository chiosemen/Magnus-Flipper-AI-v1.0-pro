"use client";

import { useEffect, useMemo, useState } from "react";
import { useSyncExternalStore } from "react";
import { motionDebugStore, type MotionDebugInstance } from "@/lib/motionDebugStore";

const DEV = process.env.NODE_ENV === "development";

function readBoolLocalStorage(key: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function writeBoolLocalStorage(key: string, value: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value ? "1" : "0");
  } catch {
    // ignore
  }
}

function readQueryToggle(): boolean | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("debugMotion");
  if (!raw) return null;
  const v = raw.trim().toLowerCase();
  if (v === "1" || v === "true" || v === "yes") return true;
  if (v === "0" || v === "false" || v === "no") return false;
  return null;
}

function useMotionDebugSnapshot() {
  return useSyncExternalStore(
    motionDebugStore.subscribe,
    () => ({
      state: motionDebugStore.getState(),
      active: motionDebugStore.getActive(),
    }),
    () => ({ state: motionDebugStore.getState(), active: [] as MotionDebugInstance[] })
  );
}

export function MotionDebugOverlay() {
  // Hard fail-safe: never render in production builds.
  if (!DEV) return null;

  const snapshot = useMotionDebugSnapshot();
  const [enabled, setEnabled] = useState(false);
  const [highlight, setHighlight] = useState(false);

  useEffect(() => {
    // Initialize from query param (highest precedence) or localStorage.
    const qp = readQueryToggle();
    const initialEnabled = qp ?? readBoolLocalStorage("DEBUG_MOTION");
    const initialHighlight = readBoolLocalStorage("DEBUG_MOTION_HIGHLIGHT");
    setEnabled(Boolean(initialEnabled));
    setHighlight(Boolean(initialHighlight));
  }, []);

  useEffect(() => {
    motionDebugStore.setEnabled(enabled);
    writeBoolLocalStorage("DEBUG_MOTION", enabled);
  }, [enabled]);

  useEffect(() => {
    motionDebugStore.setHighlight(highlight);
    writeBoolLocalStorage("DEBUG_MOTION_HIGHLIGHT", highlight);
  }, [highlight]);

  useEffect(() => {
    const root = document.documentElement;
    if (enabled && highlight) root.dataset.debugMotionHighlight = "1";
    else delete root.dataset.debugMotionHighlight;
  }, [enabled, highlight]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isToggle = e.ctrlKey && e.shiftKey && (e.key === "M" || e.key === "m");
      if (!isToggle) return;
      e.preventDefault();
      setEnabled((v) => !v);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const now = Date.now();

  const warnings = useMemo(() => {
    const activeCount = snapshot.active.length;
    const longAnimations = snapshot.active.filter((a) => (a.durationMs ?? 0) > 400).length;
    const repeating = snapshot.active.filter((a) => a.repeat === "infinite").length;

    return {
      tooMany: activeCount > 2,
      longAnimations,
      repeating,
    };
  }, [snapshot.active]);

  if (!enabled) return null;

  return (
    <>
      <style jsx global>{`
        html[data-debug-motion-highlight="1"] [data-motion-debug-active="1"] {
          outline: 2px solid rgba(255, 255, 255, 0.2);
          outline-offset: 2px;
        }
        html[data-debug-motion-highlight="1"]
          [data-motion-debug-active="1"][data-motion-debug-type="entry"] {
          outline-color: rgba(34, 197, 94, 0.9);
        }
        html[data-debug-motion-highlight="1"]
          [data-motion-debug-active="1"][data-motion-debug-type="transition"] {
          outline-color: rgba(59, 130, 246, 0.9);
        }
        html[data-debug-motion-highlight="1"]
          [data-motion-debug-active="1"][data-motion-debug-type="hover"] {
          outline-color: rgba(245, 158, 11, 0.95);
        }
        html[data-debug-motion-highlight="1"]
          [data-motion-debug-active="1"][data-motion-debug-type="pulse"],
        html[data-debug-motion-highlight="1"]
          [data-motion-debug-active="1"][data-motion-debug-repeat="infinite"] {
          outline-color: rgba(239, 68, 68, 0.95);
        }
      `}</style>

      <div className="pointer-events-none fixed bottom-4 right-4 z-[200]">
        <div className="pointer-events-auto w-[340px] rounded-xl border border-white/10 bg-black/70 backdrop-blur px-3 py-3 text-white shadow-[0_0_25px_rgba(0,0,0,0.6)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-extrabold tracking-wide text-white/90">
                Motion Debug (dev)
              </div>
              <div className="mt-1 text-[11px] text-white/60">
                Ctrl+Shift+M toggles
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEnabled(false)}
              className="rounded-md px-2 py-1 text-[11px] font-bold bg-white/10 text-white/80 hover:bg-white/15"
            >
              Close
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="text-[11px] text-white/80">
              Active:{" "}
              <span className="font-extrabold text-white">{snapshot.active.length}</span>
            </div>
            <label className="inline-flex items-center gap-2 text-[11px] text-white/70 select-none">
              <input
                type="checkbox"
                checked={highlight}
                onChange={(e) => setHighlight(e.target.checked)}
                className="h-3.5 w-3.5 accent-[#00E5FF]"
              />
              highlight
            </label>
          </div>

          {(warnings.tooMany || warnings.longAnimations > 0 || warnings.repeating > 0) && (
            <div className="mt-2 rounded-lg border border-amber-400/30 bg-amber-500/10 px-2 py-2 text-[11px] text-amber-200">
              <div className="font-bold">Warnings</div>
              <div className="mt-1 space-y-0.5">
                {warnings.tooMany && <div>• More than 2 animations active</div>}
                {warnings.repeating > 0 && (
                  <div>• {warnings.repeating} repeating animation(s)</div>
                )}
                {warnings.longAnimations > 0 && (
                  <div>• {warnings.longAnimations} animation(s) over 400ms</div>
                )}
              </div>
            </div>
          )}

          <div className="mt-3 max-h-[260px] overflow-auto rounded-lg border border-white/10 bg-white/5">
            {snapshot.active.length === 0 ? (
              <div className="p-3 text-[11px] text-white/60">
                No active animations.
              </div>
            ) : (
              <ul className="divide-y divide-white/10">
                {snapshot.active.map((a) => {
                  const elapsed = now - a.startedAt;
                  const remaining =
                    a.repeat === "infinite" || a.durationMs === null
                      ? null
                      : Math.max(0, a.durationMs - elapsed);
                  const remainingLabel =
                    a.repeat === "infinite"
                      ? "∞"
                      : remaining === null
                      ? "—"
                      : `${Math.round(remaining)}ms`;

                  return (
                    <li key={a.id} className="px-3 py-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-[11px] font-extrabold text-white/90 truncate">
                            {a.label}
                          </div>
                          <div className="mt-0.5 text-[11px] text-white/60">
                            {a.type}
                            {a.tier !== "UNKNOWN" ? ` · ${a.tier}` : ""}
                            {a.repeat === "infinite" ? " · repeat" : ""}
                          </div>
                        </div>
                        <div className="shrink-0 text-[11px] font-bold text-white/70">
                          {remainingLabel}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

