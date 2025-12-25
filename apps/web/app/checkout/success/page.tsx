import Link from 'next/link';

export default function CheckoutSuccess() {
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
          <h1 className="text-2xl font-semibold mb-2">
            Scan Capacity Reserved
          </h1>
        </div>

        <p className="text-base text-white/70 mb-6">
          Your scans are queued for the next active window.
          You'll see live activity as soon as scanning begins.
        </p>

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
          No further action needed. Scanning starts automatically during the next window.
        </p>
      </div>
    </main>
  );
}
