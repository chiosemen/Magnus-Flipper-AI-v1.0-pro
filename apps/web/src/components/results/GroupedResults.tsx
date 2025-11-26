"use client";

import { ResultCard } from "./ResultCard";

function groupBy(listings: any[], key: string) {
  const map: Record<string, any[]> = {};
  for (const item of listings) {
    const k = item[key] || "other";
    if (!map[k]) map[k] = [];
    map[k].push(item);
  }
  return Object.entries(map);
}

export function GroupedResults({ listings }: { listings: any[] }) {
  const groups = groupBy(listings, "site");

  return (
    <div className="space-y-10">
      {groups.map(([marketplace, items]) => (
        <div key={marketplace} className="space-y-6">
          <h2 className="text-lg font-semibold capitalize">{marketplace}</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <ResultCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
