"use client";

import { useMagnusData } from "@/hooks/useMagnusData";

export default function Home() {
  const { deals, alerts } = useMagnusData();

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto max-w-5xl space-y-6 px-6 py-10">
        <header className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-md bg-blue-500 shadow-lg" />
            <h1 className="text-4xl font-bold">Magnus Flipper AI</h1>
          </div>
          <p className="text-slate-300">
            Real-time marketplace alerts, AI valuations, and community wins.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <article className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Active Deals</p>
                <div className="mt-3 space-y-3">
                  {deals.length ? (
                    deals.slice(0, 5).map((deal) => (
                      <div key={deal.id}>
                        <h3 className="text-lg font-semibold">{deal.title}</h3>
                        <p className="text-sm text-slate-400">
                          Score {deal.score} — {deal.price} {deal.currency}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">
                      No deals yet — make sure the API server is running on port 4000.
                    </p>
                  )}
                </div>
              </div>
              <div className="rounded-full bg-blue-500/10 p-3 text-blue-400">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 3v18h18" />
                </svg>
              </div>
            </div>
          </article>

          <article className="rounded-xl border border-slate-800 bg-slate-900 p-6 shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Active Alerts</p>
                <p className="mt-3 text-4xl font-semibold text-white">{alerts.length}</p>
                <p className="mt-1 text-sm text-slate-500">
                  Alerts pulled straight from the backend.
                </p>
              </div>
              <div className="rounded-full bg-green-500/10 p-3 text-green-400">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 22s8-4 8-10V7a8 8 0 0 0-16 0v5c0 6 8 10 8 10Z" />
                </svg>
              </div>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
