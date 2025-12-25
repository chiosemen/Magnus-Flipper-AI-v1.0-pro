'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface ReceiptData {
  scans: number;
  marketplaces: string[];
  tier: string;
}

export default function CheckoutSuccess() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [nextETA, setNextETA] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch receipt details if session_id provided
        if (sessionId) {
          const receiptRes = await fetch(`/api/account/receipts?session_id=${sessionId}`);
          if (receiptRes.ok) {
            const data = await receiptRes.json();
            if (data.receipts && data.receipts.length > 0) {
              const latest = data.receipts[0];
              setReceipt({
                scans: latest.scans || 0,
                marketplaces: latest.marketplaces || [],
                tier: latest.tier || 'Standard',
              });
            }
          }
        }

        // Fetch next scan ETA
        const etaRes = await fetch('/api/metrics/next-scan-eta');
        if (etaRes.ok) {
          const etaData = await etaRes.json();
          setNextETA(etaData.etaMinutes);
        }
      } catch (error) {
        // Silent failure
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sessionId]);

  const formatMarketplaces = (marketplaces: string[]) => {
    if (!marketplaces || marketplaces.length === 0) return 'All marketplaces';
    const names: Record<string, string> = {
      facebook: 'Facebook',
      vinted: 'Vinted',
      gumtree: 'Gumtree',
      ebay: 'eBay',
      offerup: 'OfferUp',
    };
    return marketplaces.map((m) => names[m] || m).join(', ');
  };

  const formatETA = (minutes: number | null) => {
    if (minutes === null) return 'Soon';
    if (minutes <= 1) return 'Now';
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  };

  return (
    <main className="min-h-screen bg-[#070B12] text-white flex items-center justify-center px-6">
      <div className="max-w-md w-full border border-white/10 rounded-2xl bg-white/5 p-8 text-center">
        <div className="mb-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-300 mb-4">
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold mb-2">Payment Received</h1>
        </div>

        {loading ? (
          <p className="text-sm text-white/50 mb-6">Loading details...</p>
        ) : (
          <>
            {receipt && (
              <div className="mb-6 space-y-3">
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="text-xs text-white/50 mb-1">Credits Added</div>
                  <div className="text-lg font-semibold">
                    {receipt.scans} scan{receipt.scans !== 1 ? 's' : ''}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="text-xs text-white/50 mb-1">Marketplaces</div>
                  <div className="text-sm text-white/80">
                    {formatMarketplaces(receipt.marketplaces)}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="text-xs text-white/50 mb-1">Next Execution</div>
                  <div className="text-sm text-emerald-400/80">
                    ETA: {formatETA(nextETA)}
                  </div>
                </div>
              </div>
            )}

            <p className="text-base text-white/70 mb-6">
              {receipt
                ? 'Your scans are queued and ready. Execution begins during the next active window.'
                : 'Scan capacity reserved. Processing may take a few moments.'}
            </p>
          </>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-2.5 rounded-lg bg-cyan-300 text-black font-semibold hover:bg-cyan-200 transition text-sm"
          >
            View Scan Status
          </Link>

          <Link
            href="/dashboard"
            className="px-6 py-2.5 rounded-lg border border-white/20 text-white hover:bg-white/5 transition text-sm"
          >
            Go to Dashboard
          </Link>
        </div>

        <p className="mt-6 text-xs text-white/50">
          No further action needed. Scanning starts automatically.
        </p>
      </div>
    </main>
  );
}
