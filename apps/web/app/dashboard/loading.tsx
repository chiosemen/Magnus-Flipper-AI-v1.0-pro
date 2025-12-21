export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#0D1117] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6">
          <div className="h-9 w-40 bg-[#1a1a1a] rounded animate-pulse mb-2" />
          <div className="h-4 w-80 bg-[#1a1a1a] rounded animate-pulse" />
        </header>

        <div className="space-y-6">
          {/* Market Overview Skeleton */}
          <section>
            <div className="h-7 w-40 bg-[#1a1a1a] rounded animate-pulse mb-3" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 h-28"
                />
              ))}
            </div>
          </section>

          {/* Marketplace Breakdown Skeleton */}
          <section>
            <div className="h-7 w-52 bg-[#1a1a1a] rounded animate-pulse mb-3" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 h-24"
                />
              ))}
            </div>
          </section>

          {/* Loading Message */}
          <div className="flex items-center justify-center py-10">
            <div className="text-center">
              <div className="text-5xl mb-3 animate-bounce">⚡</div>
              <div className="text-xl font-bold text-[#4FF0E6] mb-1.5">
                Market is warming up...
              </div>
              <div className="text-sm text-[#6E7681]">
                Loading pooled marketplace intelligence
              </div>
            </div>
          </div>

          {/* Live Snapshots Skeleton */}
          <section>
            <div className="h-7 w-36 bg-[#1a1a1a] rounded animate-pulse mb-3" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                  key={i}
                  className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg overflow-hidden"
                >
                  <div className="aspect-square bg-[#0a0a0a]" />
                  <div className="p-2.5 space-y-1.5">
                    <div className="h-3.5 bg-[#0a0a0a] rounded" />
                    <div className="h-3.5 w-2/3 bg-[#0a0a0a] rounded" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
