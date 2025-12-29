import { MARKETPLACES } from '@/lib/marketplaceRegistry';
import { RuleBuilderCard } from '@/components/arbitrage/RuleBuilderCard';
import { ResultsGrid } from '@/components/arbitrage/ResultsGrid';
import { ArbitrageSidebar } from '@/components/arbitrage/ArbitrageSidebar';

export const dynamic = 'force-dynamic';

const MARKET_OPTIONS = Object.values(MARKETPLACES)
  .filter((market) => market.enabled)
  .map((market) => ({
    id: market.id,
    label: market.label,
  }));

export default function ArbitragePage() {
  return (
    <main className="min-h-screen bg-[#0b0d12] text-white p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">Arbitrage</h1>
          <p className="text-sm text-white/60">
            Configure rules and review placeholder outcomes while execution is
            staged.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)]">
          <div className="space-y-6">
            <RuleBuilderCard markets={MARKET_OPTIONS} />
            <ResultsGrid />
          </div>
          <ArbitrageSidebar />
        </div>
      </div>
    </main>
  );
}
