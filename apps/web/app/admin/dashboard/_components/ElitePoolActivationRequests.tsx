"use client";

import { Badge } from "@/components/ui/badge";
import type { ElitePoolConfig } from "@/lib/types/marketplace";

/**
 * ElitePoolActivationRequests - Informational component showing Elite pool activation requirements
 *
 * CRITICAL: This is READ-ONLY, no backend mutations allowed
 * ============================================================
 * - Shows disabled Elite pools
 * - Calculates required additional subscribers for activation
 * - Displays informational messages only
 * - NO toggles, checkboxes, or enable actions
 *
 * BEHAVIOR:
 * =========
 * - Lists all disabled Elite pools
 * - Shows estimated monthly cost per pool
 * - Calculates minimum subscribers needed (cost / ELITE_PRICE)
 * - Shows additional subscribers required beyond current count
 * - "Request Activation" button is informational only (no backend mutation)
 */

interface ElitePoolActivationRequestsProps {
  disabledPools: ElitePoolConfig[];
  currentSubscriberCount: number;
  elitePrice: number;
  apifyCuPriceUsd: number;
}

export function ElitePoolActivationRequests({
  disabledPools,
  currentSubscriberCount,
  elitePrice,
  apifyCuPriceUsd,
}: ElitePoolActivationRequestsProps) {
  if (disabledPools.length === 0) {
    return (
      <div className="bg-[#1a1a1a] border border-green-500/20 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <div className="text-2xl">✅</div>
          <div>
            <h3 className="text-sm font-semibold text-[#ededed] mb-1">
              All Elite Pools Configured
            </h3>
            <p className="text-xs text-[#6E7681]">
              No disabled Elite pools requiring activation. All configured pools are either enabled
              or intentionally disabled.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
      {/* Header */}
      <div className="border-b border-[#2a2a2a] px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-[#ededed] flex items-center gap-2">
              🔒 Elite Pool Activation Requests
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                READ-ONLY
              </Badge>
            </h3>
            <p className="text-xs text-[#6E7681] mt-1">
              Disabled pools require economic coverage before activation • No direct enable toggles
            </p>
          </div>
        </div>
      </div>

      {/* Disabled Pools List */}
      <div className="p-5 space-y-3">
        {disabledPools.map((pool) => {
          const monthlyCost = pool.estimatedMonthlyCU * apifyCuPriceUsd;
          const requiredSubscribers = Math.ceil(monthlyCost / elitePrice);
          const additionalSubscribersNeeded = Math.max(0, requiredSubscribers - currentSubscriberCount);

          return (
            <div
              key={pool.poolId}
              className="border border-[#2a2a2a] rounded-lg p-4 bg-[#0a0a0a]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {/* Pool Info */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-[#ededed]">
                      {pool.poolId}
                    </span>
                    <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-xs">
                      DISABLED
                    </Badge>
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                      Priority {pool.priority}
                    </Badge>
                  </div>

                  <div className="text-xs text-[#6E7681] mb-3">
                    {pool.marketplace.toUpperCase()} • {pool.region} • {pool.cadenceMinutes} min cadence
                  </div>

                  {/* Cost Breakdown */}
                  <div className="grid grid-cols-2 gap-3 mb-3 p-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded">
                    <div>
                      <div className="text-xs text-[#6E7681] mb-1">Monthly Cost</div>
                      <div className="text-sm font-semibold text-[#ededed]">
                        ${monthlyCost.toFixed(2)}
                      </div>
                      <div className="text-xs text-[#6E7681]">
                        {pool.estimatedMonthlyCU.toLocaleString()} CU/mo
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-[#6E7681] mb-1">Break-Even Subscribers</div>
                      <div className="text-sm font-semibold text-[#ededed]">
                        {requiredSubscribers}
                      </div>
                      <div className="text-xs text-[#6E7681]">
                        @ ${elitePrice}/mo
                      </div>
                    </div>
                  </div>

                  {/* Activation Requirement Message */}
                  <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded">
                    <span className="text-blue-400 text-sm">ℹ️</span>
                    <div className="flex-1">
                      <p className="text-xs text-blue-400">
                        {additionalSubscribersNeeded > 0 ? (
                          <>
                            <strong>Requires {additionalSubscribersNeeded} more Elite subscriber{additionalSubscribersNeeded !== 1 ? 's' : ''}</strong> to activate.
                            {" "}Current: {currentSubscriberCount}, Required: {requiredSubscribers}
                          </>
                        ) : (
                          <>
                            <strong>Sufficient coverage available</strong> with {currentSubscriberCount} subscribers.
                            {" "}Pool can be manually enabled in configuration.
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Request Activation Button (Informational Only) */}
                <div>
                  <button
                    disabled={true}
                    className="px-4 py-2 bg-[#2a2a2a] text-[#6E7681] rounded transition-colors cursor-not-allowed opacity-50"
                    title="Elite pool activation requires manual configuration file changes and economic review"
                  >
                    Request Activation
                  </button>
                  <p className="text-xs text-[#6E7681] mt-2 text-right max-w-[120px]">
                    Manual config required
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Informational Notice */}
      <div className="border-t border-[#2a2a2a] px-5 py-4 bg-[#0a0a0a]">
        <div className="flex items-start gap-3">
          <div className="text-2xl">ℹ️</div>
          <div>
            <h4 className="text-sm font-semibold text-[#ededed] mb-1">
              Elite Pool Activation Process
            </h4>
            <p className="text-xs text-[#6E7681] mb-2">
              Elite pools cannot be enabled via UI toggles. Activation requires:
            </p>
            <ol className="text-xs text-[#6E7681] space-y-1 list-decimal list-inside">
              <li>Verify sufficient Elite subscriber coverage (revenue ≥ cost)</li>
              <li>Update <code className="text-[#4FF0E6]">elitePools.ts</code> configuration file</li>
              <li>Set <code className="text-[#4FF0E6]">enabled: true</code> for target pool</li>
              <li>Run CI verification: <code className="text-[#4FF0E6]">pnpm verify:elite-economics</code></li>
              <li>Create pull request with economic justification</li>
              <li>Deploy after approval</li>
            </ol>
            <p className="text-xs text-[#6E7681] mt-2">
              This process ensures economic sustainability and prevents accidental cost overruns.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
