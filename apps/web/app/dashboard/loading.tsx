export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#0D1117] p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <div className="h-10 w-48 bg-[#1a1a1a] rounded animate-pulse mb-2" />
          <div className="h-5 w-96 bg-[#1a1a1a] rounded animate-pulse" />
        </header>

        <div className="space-y-8">
          {/* Market Overview Skeleton */}
          <section>
            <div className="h-8 w-48 bg-[#1a1a1a] rounded animate-pulse mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 h-32"
                />
              ))}
            </div>
          </section>

          {/* Marketplace Breakdown Skeleton */}
          <section>
            <div className="h-8 w-64 bg-[#1a1a1a] rounded animate-pulse mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 h-28"
                />
              ))}
            </div>
          </section>

          {/* Loading Message */}
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="text-6xl mb-4 animate-bounce">⚡</div>
              <div className="text-2xl font-bold text-[#4FF0E6] mb-2">
                Market is warming up...
              </div>
              <div className="text-[#a0a0a0]">
                Loading pooled marketplace intelligence
              </div>
            </div>
          </div>

          {/* Live Snapshots Skeleton */}
          <section>
            <div className="h-8 w-48 bg-[#1a1a1a] rounded animate-pulse mb-4" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                  key={i}
                  className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg overflow-hidden"
                >
                  <div className="aspect-square bg-[#0a0a0a]" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-[#0a0a0a] rounded" />
                    <div className="h-4 w-2/3 bg-[#0a0a0a] rounded" />
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
