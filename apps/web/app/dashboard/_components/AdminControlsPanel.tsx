"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

interface AdminControls {
  disable_all_scraping: boolean;
  disable_marketplace_facebook: boolean;
  disable_marketplace_cars: boolean;
  global_rate_multiplier: number;
  notes: string;
  updated_at: string | null;
  updated_by: string | null;
}

/**
 * AdminControlsPanel - SAFE MODE kill-switches for marketplace scraping
 *
 * CRITICAL ARCHITECTURE:
 * =====================
 * This component ONLY writes configuration flags to Supabase.
 * It does NOT:
 * - Trigger immediate scraping actions
 * - Access Redis or BullMQ queues
 * - Directly manipulate workers
 * - Cause race conditions
 *
 * WHY THIS IS SAFER THAN DIRECT JOB CANCELLATION:
 * ================================================
 * - Workers read flags on their NEXT cycle (eventual consistency)
 * - No direct queue manipulation prevents race conditions
 * - Flags are single source of truth (no distributed state conflicts)
 * - Admins can toggle without coordinating with worker lifecycle
 * - Preserves audit trail (updated_at, updated_by)
 *
 * WHY THIS PRESERVES POOLED-ONLY DOCTRINE:
 * ========================================
 * - Flags control worker behavior, not data queries
 * - UI remains read-only for data visualization
 * - No per-user scraping triggers from this interface
 * - Workers self-throttle based on configuration
 *
 * BEHAVIOR:
 * =========
 * 1. Admin toggles flag in UI
 * 2. UI sends PATCH to /api/admin/controls
 * 3. API writes flag to Supabase admin_controls table
 * 4. Worker-scheduler reads flags on next tick (~1-5 min)
 * 5. Worker self-throttles or disables marketplace
 *
 * SECURITY:
 * =========
 * - Server-side API route enforces admin role
 * - Supabase RLS requires admin role for writes
 * - Client-side guards are UX only (not security)
 */
export function AdminControlsPanel() {
  const [controls, setControls] = useState<AdminControls | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    field: keyof AdminControls;
    value: boolean | number;
  } | null>(null);

  // Fetch current controls from API
  useEffect(() => {
    async function fetchControls() {
      try {
        const res = await fetch("/api/admin/controls");
        if (!res.ok) {
          throw new Error("Failed to fetch admin controls");
        }
        const data = await res.json();
        setControls(data);
      } catch (error) {
        console.error("Failed to fetch admin controls:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchControls();
  }, []);

  // Update a single control flag
  const updateControl = async (field: keyof AdminControls, value: boolean | number | string) => {
    if (!controls) return;

    setSaving(true);
    try {
      const res = await fetch("/api/admin/controls", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });

      if (!res.ok) {
        throw new Error("Failed to update control");
      }

      const updated = await res.json();
      setControls(updated);
      setConfirmAction(null);
    } catch (error) {
      console.error("Failed to update control:", error);
      alert("Failed to update control. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Handle toggle with confirmation for critical flags
  const handleToggle = (field: keyof AdminControls, currentValue: boolean) => {
    const newValue = !currentValue;

    // Show confirmation for enabling critical flags
    if ((field === "disable_all_scraping" || field.startsWith("disable_marketplace_")) && newValue) {
      setConfirmAction({ field, value: newValue });
    } else {
      updateControl(field, newValue);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 w-40 bg-[#2a2a2a] rounded mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-[#2a2a2a] rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!controls) {
    return (
      <div className="bg-[#1a1a1a] border border-red-500/30 rounded-lg p-6">
        <div className="text-center">
          <div className="text-4xl mb-2">⚠️</div>
          <div className="text-sm text-red-400">Failed to load admin controls</div>
          <div className="text-xs text-[#6E7681] mt-1">Check API route and permissions</div>
        </div>
      </div>
    );
  }

  const lastUpdated = controls.updated_at
    ? new Date(controls.updated_at).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Never";

  return (
    <div className="bg-[#1a1a1a] border border-red-500/20 rounded-lg">
      {/* Header */}
      <div className="border-b border-[#2a2a2a] px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-[#ededed] flex items-center gap-2">
              🚨 Admin Kill-Switches
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                SAFE MODE
              </Badge>
            </h3>
            <p className="text-xs text-[#6E7681] mt-1">
              Flags take effect on next scheduler tick (~1-5 min) • No immediate side effects
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-[#6E7681]">Last Updated</div>
            <div className="text-sm text-[#ededed] font-mono">{lastUpdated}</div>
            {controls.updated_by && (
              <div className="text-xs text-[#6E7681] mt-0.5">by {controls.updated_by}</div>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-5 space-y-4">
        {/* Global Kill Switch */}
        <div className="bg-[#0a0a0a] border border-red-500/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-[#ededed]">
                  🛑 Disable All Scraping
                </span>
                {controls.disable_all_scraping && (
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                    ACTIVE
                  </Badge>
                )}
              </div>
              <p className="text-xs text-[#6E7681]">
                Emergency stop • Disables all marketplace workers globally
              </p>
            </div>
            <button
              onClick={() => handleToggle("disable_all_scraping", controls.disable_all_scraping)}
              disabled={saving}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                ${controls.disable_all_scraping ? "bg-red-500" : "bg-[#2a2a2a]"}
                ${saving ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              `}
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${controls.disable_all_scraping ? "translate-x-6" : "translate-x-1"}
                `}
              />
            </button>
          </div>
        </div>

        {/* Marketplace-Specific Toggles */}
        <div className="space-y-3">
          <div className="text-xs text-[#6E7681] uppercase tracking-wide">
            Marketplace Controls
          </div>

          {/* Facebook */}
          <div className="flex items-center justify-between p-3 bg-[#0a0a0a]/50 rounded border border-[#2a2a2a]">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#ededed]">Facebook Marketplace</span>
                {controls.disable_marketplace_facebook && (
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                    DISABLED
                  </Badge>
                )}
              </div>
            </div>
            <button
              onClick={() =>
                handleToggle("disable_marketplace_facebook", controls.disable_marketplace_facebook)
              }
              disabled={saving || controls.disable_all_scraping}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                ${controls.disable_marketplace_facebook ? "bg-yellow-500" : "bg-[#2a2a2a]"}
                ${saving || controls.disable_all_scraping ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              `}
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${controls.disable_marketplace_facebook ? "translate-x-6" : "translate-x-1"}
                `}
              />
            </button>
          </div>

          {/* Cars.com */}
          <div className="flex items-center justify-between p-3 bg-[#0a0a0a]/50 rounded border border-[#2a2a2a]">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#ededed]">Cars.com</span>
                {controls.disable_marketplace_cars && (
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                    DISABLED
                  </Badge>
                )}
              </div>
            </div>
            <button
              onClick={() =>
                handleToggle("disable_marketplace_cars", controls.disable_marketplace_cars)
              }
              disabled={saving || controls.disable_all_scraping}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                ${controls.disable_marketplace_cars ? "bg-yellow-500" : "bg-[#2a2a2a]"}
                ${saving || controls.disable_all_scraping ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              `}
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${controls.disable_marketplace_cars ? "translate-x-6" : "translate-x-1"}
                `}
              />
            </button>
          </div>
        </div>

        {/* Rate Multiplier */}
        <div className="bg-[#0a0a0a]/50 border border-[#2a2a2a] rounded-lg p-4">
          <div className="mb-3">
            <div className="text-sm font-semibold text-[#ededed] mb-1">
              ⚡ Global Rate Multiplier
            </div>
            <p className="text-xs text-[#6E7681]">
              Adjust scraping frequency • 1.0 = normal, 0.5 = half speed, 2.0 = double speed
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0.1"
              max="3.0"
              step="0.1"
              value={controls.global_rate_multiplier}
              onChange={(e) => updateControl("global_rate_multiplier", parseFloat(e.target.value))}
              disabled={saving}
              className="flex-1 h-2 bg-[#2a2a2a] rounded-lg appearance-none cursor-pointer accent-[#4FF0E6]"
            />
            <div className="text-sm font-mono text-[#4FF0E6] w-12 text-right">
              {controls.global_rate_multiplier.toFixed(1)}x
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-[#0a0a0a]/50 border border-[#2a2a2a] rounded-lg p-4">
          <label className="block text-sm font-semibold text-[#ededed] mb-2">
            📝 Admin Notes
          </label>
          <textarea
            value={controls.notes}
            onChange={(e) => setControls({ ...controls, notes: e.target.value })}
            onBlur={(e) => updateControl("notes", e.target.value)}
            disabled={saving}
            placeholder="Reason for changes, incidents, etc..."
            className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded px-3 py-2 text-sm text-[#ededed] placeholder-[#6E7681] focus:outline-none focus:border-[#4FF0E6] transition-colors"
            rows={3}
          />
        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-red-500/30 rounded-lg max-w-md w-full p-6">
            <div className="text-center mb-4">
              <div className="text-5xl mb-3">⚠️</div>
              <h3 className="text-lg font-bold text-[#ededed] mb-2">Confirm Kill-Switch</h3>
              <p className="text-sm text-[#6E7681]">
                You are about to disable{" "}
                <span className="text-red-400 font-semibold">
                  {confirmAction.field === "disable_all_scraping"
                    ? "ALL scraping globally"
                    : confirmAction.field.replace("disable_marketplace_", "")}
                </span>
                . Workers will stop on their next cycle (~1-5 min).
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-[#ededed] rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmAction) {
                    updateControl(confirmAction.field, confirmAction.value);
                  }
                }}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded transition-colors font-semibold"
              >
                Confirm Disable
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
