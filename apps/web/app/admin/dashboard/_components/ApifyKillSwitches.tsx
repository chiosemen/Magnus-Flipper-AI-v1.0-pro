"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";

/**
 * Apify Kill Switches - UI-Only Component
 *
 * CRITICAL: This is UI-ONLY, no backend logic implemented yet
 * ===========================================================
 * - Toggles are visual only (no actual scraping control)
 * - Confirmation dialogs prevent accidental activation
 * - Clear warning states and serious copy
 * - Backend integration required for actual pause functionality
 *
 * SWITCHES:
 * =========
 * 1. Pause All Apify Scrapes - Global emergency stop
 * 2. Pause Pools Exceeding Budget - Pause pools over daily $ threshold
 *
 * NOTE: Elite pool activation is NOT controlled via toggles.
 * Elite pools require economic coverage validation before enabling.
 *
 * BEHAVIOR:
 * =========
 * - Red warning states when active
 * - Explicit confirmation required before activation
 * - Clear messaging about impact
 * - Visual hierarchy: most dangerous = most prominent
 */

interface KillSwitch {
  id: string;
  enabled: boolean;
  label: string;
  description: string;
  warningMessage: string;
  dangerLevel: "critical" | "high" | "medium";
}

export function ApifyKillSwitches() {
  const [switches, setSwitches] = useState<KillSwitch[]>([
    {
      id: "pause_all",
      enabled: false,
      label: "Pause All Apify Scrapes",
      description: "Immediately halt all Apify scraping operations across all marketplaces and regions.",
      warningMessage:
        "This will stop ALL data collection. No new deals will be discovered until scraping is resumed. Existing saved searches will not receive updates.",
      dangerLevel: "critical",
    },
    {
      id: "pause_budget_exceeded",
      enabled: false,
      label: "Pause Pools Exceeding $50/day",
      description: "Automatically pause any pool that exceeds $50 in daily Apify costs to prevent runaway spending.",
      warningMessage:
        "Pools exceeding the daily budget threshold will be paused automatically. This may impact data freshness for high-volume marketplaces.",
      dangerLevel: "medium",
    },
  ]);

  const [budgetThreshold, setBudgetThreshold] = useState<number>(50);
  const [confirmDialog, setConfirmDialog] = useState<{
    switchId: string;
    action: "enable" | "disable";
  } | null>(null);

  const handleToggle = (switchId: string) => {
    const currentSwitch = switches.find((s) => s.id === switchId);
    if (!currentSwitch) return;

    // Require confirmation for enabling kill switches
    if (!currentSwitch.enabled) {
      setConfirmDialog({ switchId, action: "enable" });
    } else {
      // Disabling is safe, no confirmation needed
      setSwitches((prev) =>
        prev.map((s) => (s.id === switchId ? { ...s, enabled: false } : s))
      );
    }
  };

  const confirmToggle = () => {
    if (!confirmDialog) return;

    setSwitches((prev) =>
      prev.map((s) =>
        s.id === confirmDialog.switchId
          ? { ...s, enabled: confirmDialog.action === "enable" }
          : s
      )
    );

    setConfirmDialog(null);

    // TODO: Backend integration - send toggle to API
    console.log(
      `[Kill Switch] ${confirmDialog.switchId} ${confirmDialog.action === "enable" ? "ENABLED" : "DISABLED"}`
    );
  };

  const getDangerColor = (level: string) => {
    switch (level) {
      case "critical":
        return {
          border: "border-red-500/30",
          bg: "bg-red-500/5",
          badge: "bg-red-500/20 text-red-400 border-red-500/30",
          activeBorder: "border-red-500",
        };
      case "high":
        return {
          border: "border-orange-500/30",
          bg: "bg-orange-500/5",
          badge: "bg-orange-500/20 text-orange-400 border-orange-500/30",
          activeBorder: "border-orange-500",
        };
      case "medium":
        return {
          border: "border-yellow-500/30",
          bg: "bg-yellow-500/5",
          badge: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
          activeBorder: "border-yellow-500",
        };
      default:
        return {
          border: "border-[#2a2a2a]",
          bg: "bg-[#0a0a0a]",
          badge: "bg-[#2a2a2a] text-[#6E7681]",
          activeBorder: "border-[#4FF0E6]",
        };
    }
  };

  const activeSwitch = confirmDialog
    ? switches.find((s) => s.id === confirmDialog.switchId)
    : null;

  return (
    <div className="bg-[#1a1a1a] border border-red-500/20 rounded-lg">
      {/* Header */}
      <div className="border-b border-[#2a2a2a] px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-[#ededed] flex items-center gap-2">
              🚨 Apify Kill Switches
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                UI ONLY - NO LOGIC YET
              </Badge>
            </h3>
            <p className="text-xs text-[#6E7681] mt-1">
              Emergency controls for Apify scraping operations • Requires explicit confirmation
            </p>
          </div>
        </div>
      </div>

      {/* Kill Switches */}
      <div className="p-5 space-y-4">
        {switches.map((killSwitch) => {
          const colors = getDangerColor(killSwitch.dangerLevel);

          return (
            <div
              key={killSwitch.id}
              className={`
                border rounded-lg p-4 transition-all
                ${killSwitch.enabled ? colors.activeBorder + " " + colors.bg : colors.border + " bg-[#0a0a0a]"}
              `}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-[#ededed]">
                      {killSwitch.label}
                    </span>
                    {killSwitch.enabled && (
                      <Badge className={colors.badge + " text-xs"}>
                        ACTIVE
                      </Badge>
                    )}
                    {killSwitch.dangerLevel === "critical" && (
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                        CRITICAL
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-[#6E7681] mb-2">
                    {killSwitch.description}
                  </p>
                  {killSwitch.enabled && (
                    <div className="flex items-start gap-2 mt-3 p-2 bg-[#1a1a1a] border border-red-500/20 rounded">
                      <span className="text-red-400 text-sm">⚠️</span>
                      <p className="text-xs text-red-400">
                        <strong>Active:</strong> {killSwitch.warningMessage}
                      </p>
                    </div>
                  )}
                </div>

                {/* Toggle Switch */}
                <button
                  onClick={() => handleToggle(killSwitch.id)}
                  disabled={false} // Always enabled for UI demo
                  className={`
                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                    ${killSwitch.enabled ? "bg-red-500" : "bg-[#2a2a2a]"}
                    hover:opacity-80 cursor-pointer
                  `}
                  aria-label={`Toggle ${killSwitch.label}`}
                >
                  <span
                    className={`
                      inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                      ${killSwitch.enabled ? "translate-x-6" : "translate-x-1"}
                    `}
                  />
                </button>
              </div>

              {/* Budget Threshold Input (for budget-based switch) */}
              {killSwitch.id === "pause_budget_exceeded" && (
                <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
                  <label className="block text-xs text-[#6E7681] mb-2">
                    Daily Budget Threshold (USD)
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#ededed]">$</span>
                    <input
                      type="number"
                      min="1"
                      max="500"
                      value={budgetThreshold}
                      onChange={(e) => setBudgetThreshold(Number(e.target.value))}
                      className="w-24 bg-[#0a0a0a] border border-[#2a2a2a] rounded px-3 py-1.5 text-sm text-[#ededed] focus:outline-none focus:border-[#4FF0E6] transition-colors"
                    />
                    <span className="text-xs text-[#6E7681]">per pool, per day</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Warning Notice */}
      <div className="border-t border-[#2a2a2a] px-5 py-4 bg-[#0a0a0a]">
        <div className="flex items-start gap-3">
          <div className="text-2xl">ℹ️</div>
          <div>
            <h4 className="text-sm font-semibold text-[#ededed] mb-1">
              UI-Only Demo Mode
            </h4>
            <p className="text-xs text-[#6E7681]">
              These kill switches are <strong>visual only</strong> and do not currently affect Apify scraping.
              Backend integration is required to implement actual pause functionality. Toggles will log to console
              for testing purposes.
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmDialog && activeSwitch && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-red-500/30 rounded-lg max-w-md w-full p-6">
            <div className="text-center mb-4">
              <div className="text-5xl mb-3">⚠️</div>
              <h3 className="text-lg font-bold text-[#ededed] mb-2">
                Confirm Kill Switch Activation
              </h3>
              <p className="text-sm text-[#6E7681] mb-4">
                You are about to activate:{" "}
                <span className="text-red-400 font-semibold">
                  {activeSwitch.label}
                </span>
              </p>
              <div className="bg-red-500/10 border border-red-500/20 rounded p-3 mb-4">
                <p className="text-xs text-red-400 text-left">
                  <strong>Impact:</strong> {activeSwitch.warningMessage}
                </p>
              </div>
              <p className="text-xs text-[#6E7681]">
                This action will take effect immediately. Are you sure you want to proceed?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDialog(null)}
                className="flex-1 px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-[#ededed] rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmToggle}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded transition-colors font-semibold"
              >
                Confirm Activation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
