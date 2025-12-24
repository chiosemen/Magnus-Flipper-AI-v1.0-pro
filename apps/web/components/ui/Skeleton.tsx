/**
 * Standardized Skeleton Loaders
 * Dark-theme friendly, calm animations, matches final layouts
 */

export function SkeletonCard() {
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-5 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-3 bg-[#2a2a2a] rounded w-24"></div>
        <div className="h-5 w-5 bg-[#2a2a2a] rounded"></div>
      </div>
      <div className="h-7 bg-[#2a2a2a] rounded w-32 mb-2"></div>
      <div className="h-3 bg-[#2a2a2a] rounded w-20"></div>
    </div>
  );
}

export function SkeletonFeedCard() {
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 animate-pulse">
      <div className="mb-3">
        <div className="h-4 bg-[#2a2a2a] rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-[#2a2a2a] rounded w-32"></div>
      </div>
      <div className="space-y-2 pt-2 border-t border-[#2a2a2a]">
        <div className="flex justify-between">
          <div className="h-3 bg-[#2a2a2a] rounded w-16"></div>
          <div className="h-3 bg-[#2a2a2a] rounded w-20"></div>
        </div>
        <div className="flex justify-between">
          <div className="h-3 bg-[#2a2a2a] rounded w-20"></div>
          <div className="h-3 bg-[#2a2a2a] rounded w-20"></div>
        </div>
        <div className="flex justify-between">
          <div className="h-3 bg-[#2a2a2a] rounded w-16"></div>
          <div className="h-4 bg-[#2a2a2a] rounded w-16"></div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonStatCard() {
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-3.5 animate-pulse">
      <div className="h-3 bg-[#2a2a2a] rounded w-20 mb-2"></div>
      <div className="h-6 bg-[#2a2a2a] rounded w-16"></div>
    </div>
  );
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonFeedCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

