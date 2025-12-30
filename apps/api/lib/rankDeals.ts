export type DealConfidence = "low" | "medium" | "high";

type RankOptions = {
  limit?: number;
  minConfidence?: DealConfidence;
};

type RankableItem = {
  dealScore?: {
    score: number;
    confidence?: DealConfidence;
  };
  postedAt?: string;
  fetchedAt?: string;
};

const CONFIDENCE_ORDER: Record<DealConfidence, number> = {
  low: 0,
  medium: 1,
  high: 2,
};

function confidenceAtLeast(current: DealConfidence, target: DealConfidence) {
  return CONFIDENCE_ORDER[current] >= CONFIDENCE_ORDER[target];
}

function parseTimestamp(value?: string): number {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function rankDeals<T extends RankableItem>(
  items: T[],
  options: RankOptions = {},
): T[] {
  const ranked = items
    .map((item, index) => {
      const score =
        typeof item.dealScore?.score === "number"
          ? item.dealScore.score
          : -1;
      const confidence = item.dealScore?.confidence ?? "low";
      const freshness = Math.max(
        parseTimestamp(item.postedAt),
        parseTimestamp(item.fetchedAt),
      );
      return {
        item,
        index,
        score,
        confidence,
        confidenceRank: CONFIDENCE_ORDER[confidence],
        freshness,
      };
    })
    .filter((entry) => {
      if (!options.minConfidence) return true;
      return confidenceAtLeast(entry.confidence, options.minConfidence);
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.confidenceRank !== a.confidenceRank) {
        return b.confidenceRank - a.confidenceRank;
      }
      if (b.freshness !== a.freshness) return b.freshness - a.freshness;
      return a.index - b.index;
    });

  const limited =
    typeof options.limit === "number" && options.limit > 0
      ? ranked.slice(0, options.limit)
      : ranked;

  return limited.map((entry) => entry.item);
}
