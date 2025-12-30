import { headers } from 'next/headers';
import { createSupabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type Signal = {
  id: string;
  market: string;
  query: string;
  score: number;
  confidence: string;
  explanation: string[];
  warnings: string[];
  listing: {
    title?: string;
    price?: string | number;
    url?: string;
    image?: string;
    locationText?: string;
  };
  created_at: string;
};

type SignalsPayload = {
  tier: string;
  signals: Signal[];
};

async function getApiBaseUrl() {
  const envBase = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (envBase) return envBase;
  const headerList = await headers();
  const host = headerList.get('host');
  if (!host) return '';
  const proto = headerList.get('x-forwarded-proto') ?? 'https';
  return `${proto}://${host}`;
}

function scoreTone(score: number) {
  if (score >= 75) return 'text-emerald-300';
  if (score >= 50) return 'text-yellow-300';
  return 'text-red-300';
}

export default async function SignalsPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const token = session?.access_token;
  if (!token) {
    return (
      <main className="min-h-screen bg-[#0b0d12] text-white flex items-center justify-center p-8">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-2xl font-semibold">Signals</h1>
          <p className="text-sm text-white/60">
            Sign in to view scored opportunities.
          </p>
        </div>
      </main>
    );
  }

  const baseUrl = await getApiBaseUrl();
  if (!baseUrl) {
    return (
      <main className="min-h-screen bg-[#0b0d12] text-white flex items-center justify-center p-8">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-2xl font-semibold">Signals</h1>
          <p className="text-sm text-white/60">
            Unable to resolve API base URL.
          </p>
        </div>
      </main>
    );
  }

  const response = await fetch(`${baseUrl}/api/signals`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (response.status === 403) {
    return (
      <main className="min-h-screen bg-[#0b0d12] text-white flex items-center justify-center p-8">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-2xl font-semibold">Signals</h1>
          <p className="text-sm text-white/60">
            Upgrade to access Deal Score signals.
          </p>
        </div>
      </main>
    );
  }

  if (!response.ok) {
    return (
      <main className="min-h-screen bg-[#0b0d12] text-white flex items-center justify-center p-8">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-2xl font-semibold">Signals</h1>
          <p className="text-sm text-white/60">
            Unable to load signals right now.
          </p>
        </div>
      </main>
    );
  }

  const data = (await response.json()) as SignalsPayload;

  return (
    <main className="min-h-screen bg-[#0b0d12] text-white p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">Signals</h1>
          <p className="text-sm text-white/60">
            Sorted by Deal Score. Signals are read-only highlights.
          </p>
        </header>

        {data.signals.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-[#121621] p-6 text-sm text-white/70">
            No signals yet. Run a few searches to generate candidates.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {data.signals.map((signal) => (
              <div
                key={signal.id}
                className="rounded-xl border border-white/10 bg-[#121621] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs text-white/50 uppercase tracking-wide">
                      {signal.market} · {signal.query}
                    </div>
                    <div className="text-base font-semibold text-white mt-1">
                      {signal.listing?.title ?? 'Listing'}
                    </div>
                    {signal.listing?.price && (
                      <div className="text-sm text-emerald-300 font-semibold mt-1">
                        {signal.listing.price}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-lg font-semibold ${scoreTone(
                        signal.score
                      )}`}
                    >
                      {signal.score}
                    </div>
                    <div className="text-xs text-white/50 uppercase">
                      {signal.confidence} confidence
                    </div>
                  </div>
                </div>

                {signal.listing?.url && (
                  <a
                    href={signal.listing.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex text-xs text-cyan-300 hover:text-cyan-200"
                  >
                    View listing →
                  </a>
                )}

                {signal.explanation?.length > 0 && (
                  <ul className="mt-3 space-y-1 text-xs text-white/70 list-disc list-inside">
                    {signal.explanation.slice(0, 3).map((line, idx) => (
                      <li key={`${signal.id}-exp-${idx}`}>{line}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
