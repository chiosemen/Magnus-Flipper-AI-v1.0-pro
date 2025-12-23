"use client";

import Link from "next/link";
import { APIFY_ONLY_MODE } from "@/config/apify";

type Props = {
  message?: string;
};

export function ApifyModeNotice({ message }: Props) {
  // Always render something visible
  if (!APIFY_ONLY_MODE) {
    // Disabled state - visible but non-interactive
    return (
      <div className="rounded-lg border border-slate-600/40 bg-slate-800/30 p-4 text-slate-400 opacity-60">
        <div className="font-semibold mb-1">Apify mode is currently disabled</div>
        <p className="text-sm text-slate-400/80">
          Apify ingestion mode is not active. Legacy pipelines are running normally.
        </p>
      </div>
    );
  }

  // Enabled state - normal content
  return (
    <div className="rounded-lg border border-sky-500/40 bg-sky-500/10 p-4 text-sky-100">
      <div className="font-semibold mb-1">Apify ingestion mode active</div>
      <p className="text-sm text-sky-100/80">
        {message ||
          "Legacy pipelines are paused. Use the live Apify scraper demo instead."}
      </p>
      <Link
        href="/apify-demo"
        className="mt-2 inline-flex text-sm font-semibold text-sky-200 underline"
      >
        Go to Apify demo
      </Link>
    </div>
  );
}
