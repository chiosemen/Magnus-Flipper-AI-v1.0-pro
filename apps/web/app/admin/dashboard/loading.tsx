/**
 * Loading State for Admin Dashboard
 * Displays skeleton UI while dashboard data is being fetched
 */
export default function AdminDashboardLoading() {
  return (
    <div className="min-h-screen bg-[#0D1117] p-4 sm:p-6 lg:p-8">
      <div className="animate-pulse space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-80 bg-[#2a2a2a] rounded mb-2" />
            <div className="h-4 w-64 bg-[#2a2a2a] rounded" />
          </div>
          <div className="h-12 w-32 bg-[#2a2a2a] rounded" />
        </div>

        {/* Financial Overview skeleton */}
        <div>
          <div className="h-6 w-48 bg-[#2a2a2a] rounded mb-3" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-5 h-24"
              >
                <div className="h-4 w-24 bg-[#2a2a2a] rounded mb-3" />
                <div className="h-6 w-16 bg-[#2a2a2a] rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Operational Metrics skeleton */}
        <div>
          <div className="h-6 w-48 bg-[#2a2a2a] rounded mb-3" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-5 h-24"
              >
                <div className="h-4 w-24 bg-[#2a2a2a] rounded mb-3" />
                <div className="h-6 w-16 bg-[#2a2a2a] rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Cost Breakdown skeleton */}
        <div>
          <div className="h-6 w-56 bg-[#2a2a2a] rounded mb-3" />
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg h-48" />
        </div>

        {/* Burn Rate Chart skeleton */}
        <div>
          <div className="h-6 w-48 bg-[#2a2a2a] rounded mb-3" />
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg h-64" />
        </div>
      </div>

      {/* Loading indicator */}
      <div className="text-center text-[#4FF0E6] text-lg py-8 mt-8">
        <div className="text-4xl mb-2">⚡</div>
        Loading admin metrics...
      </div>
    </div>
  );
}
