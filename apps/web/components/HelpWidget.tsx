"use client";

import Link from "next/link";
import { LifeBuoy } from "lucide-react";

export function HelpWidget() {
  return (
    <Link
      href="/support"
      className="fixed bottom-5 right-5 z-[80] inline-flex items-center gap-2 rounded-full px-4 py-3 bg-[#121212] border border-white/10 text-white/85 text-sm font-extrabold shadow-[0_0_30px_rgba(0,0,0,0.6)] hover:border-[#00E5FF]/50 hover:text-white transition-colors"
      aria-label="Open support"
    >
      <LifeBuoy className="h-4 w-4 text-[#00E5FF]" />
      Help
    </Link>
  );
}

