'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MarketAgentUpgradeModal } from './MarketAgentUpgradeModal';

export function MarketAgentGate() {
  const [showUpgrade, setShowUpgrade] = useState(false);

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 text-white flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 text-center">
            <h1 className="text-3xl font-bold mb-4">Magnus Market Agent</h1>
            <p className="text-slate-300 mb-8">
              This feature is available on the Magnus Market Agent plan.
            </p>

            <div className="bg-slate-900/50 rounded-lg p-6 mb-8 text-left">
              <ul className="space-y-3 text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>Persistent market observation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>Live capture + verification signals</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>Higher concurrency & freshness guarantees</span>
                </li>
              </ul>
            </div>

            <Button size="lg" onClick={() => setShowUpgrade(true)}>
              Upgrade to Market Agent
            </Button>
          </div>
        </div>
      </div>

      <MarketAgentUpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} />
    </>
  );
}

