"use client";

import { useEffect, useState } from "react";

type ExecutionMode = "off" | "admin" | "public";

const MODE_DETAILS: Record<ExecutionMode, { label: string; description: string }> = {
  off: {
    label: "Marketing only",
    description: "Execution disabled for everyone.",
  },
  admin: {
    label: "Admin testing",
    description: "Only admins can execute or consume credits.",
  },
  public: {
    label: "Live",
    description: "Execution enabled for all users.",
  },
};

export function ExecutionModeToggle() {
  const [mode, setMode] = useState<ExecutionMode | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadMode = async () => {
      try {
        const res = await fetch("/api/admin/execution-mode");
        const json = await res.json();
        if (!mounted) return;
        if (json?.ok && json?.mode) {
          setMode(json.mode as ExecutionMode);
        } else {
          setMessage("Unable to load execution mode.");
        }
      } catch (error) {
        if (mounted) {
          setMessage("Unable to load execution mode.");
        }
      }
    };

    loadMode();
    return () => {
      mounted = false;
    };
  }, []);

  const updateMode = async (nextMode: ExecutionMode) => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/execution-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: nextMode }),
      });
      const json = await res.json();
      if (json?.ok) {
        setMode(nextMode);
        setMessage(`Execution mode set to "${nextMode}".`);
      } else {
        setMessage(json?.reason || "Update failed.");
      }
    } catch (error) {
      setMessage("Update failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg p-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[#ededed]">
            Execution Mode
          </h2>
          <p className="text-xs text-[#6E7681] mt-1">
            Edge Config backed runtime control for execution.
          </p>
        </div>
        {mode && (
          <span className="text-xs px-2 py-1 rounded-full border border-white/10 text-white/80">
            {MODE_DETAILS[mode].label}
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
        {(["off", "admin", "public"] as ExecutionMode[]).map((entry) => (
          <button
            key={entry}
            type="button"
            disabled={loading}
            onClick={() => updateMode(entry)}
            className={`rounded-md border px-3 py-2 text-xs font-semibold transition ${
              mode === entry
                ? "border-cyan-400/60 bg-cyan-400/10 text-cyan-200"
                : "border-white/10 bg-white/5 text-white/70 hover:border-cyan-400/40"
            }`}
          >
            <div className="text-sm font-semibold">{MODE_DETAILS[entry].label}</div>
            <div className="text-[11px] font-normal text-white/50 mt-1">
              {MODE_DETAILS[entry].description}
            </div>
          </button>
        ))}
      </div>

      {message && (
        <div className="mt-3 text-xs text-white/60">
          {message}
        </div>
      )}
    </section>
  );
}
