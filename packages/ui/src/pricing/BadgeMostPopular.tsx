import React from "react";

export function BadgeMostPopular({ label = "Most Popular" }: { label?: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-cyan-500 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-950">
      {label}
    </span>
  );
}
