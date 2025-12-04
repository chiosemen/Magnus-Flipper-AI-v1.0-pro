import { SectionHeader } from "@/components/ui/SectionHeader";
import { MetricCard } from "@/components/ui/MetricCard";
import { TableShell } from "@/components/ui/TableShell";
import { ChartShell } from "@/components/ui/ChartShell";

export default function FreeDashboard() {
  return (
    <div className="space-y-8">
      <SectionHeader
        title="Free Dashboard"
        subtitle="Limited access - upgrade to unlock more features"
      />

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard label="Searches Used" value="3/10" icon="🔍" />
        <MetricCard label="Total Profit" value="£0" icon="💰" locked />
        <MetricCard label="Active Listings" value="--" icon="📦" locked />
        <MetricCard label="ROI Average" value="--" icon="📊" locked />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartShell title="Profit Trend" locked />
        <ChartShell title="Marketplace Distribution" locked />
      </div>

      {/* Recent Searches */}
      <div>
        <h3 className="text-lg font-semibold text-[#ededed] mb-4">
          Recent Searches
        </h3>
        <TableShell headers={["Search Term", "Date", "Results", "Actions"]}>
          <tr>
            <td className="px-6 py-4 text-sm text-[#ededed]">PlayStation 5</td>
            <td className="px-6 py-4 text-sm text-[#a0a0a0]">2 hours ago</td>
            <td className="px-6 py-4 text-sm text-[#a0a0a0]">12 results</td>
            <td className="px-6 py-4 text-sm">
              <button className="text-blue-500 hover:text-blue-400">View</button>
            </td>
          </tr>
          <tr>
            <td className="px-6 py-4 text-sm text-[#ededed]">iPhone 15</td>
            <td className="px-6 py-4 text-sm text-[#a0a0a0]">5 hours ago</td>
            <td className="px-6 py-4 text-sm text-[#a0a0a0]">8 results</td>
            <td className="px-6 py-4 text-sm">
              <button className="text-blue-500 hover:text-blue-400">View</button>
            </td>
          </tr>
        </TableShell>
      </div>

      {/* Upgrade CTA */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-lg p-8 text-center">
        <h3 className="text-2xl font-bold text-[#ededed] mb-2">
          Unlock Full Access
        </h3>
        <p className="text-[#a0a0a0] mb-6">
          Upgrade to Pro for unlimited searches, live feed, and advanced analytics
        </p>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
          Upgrade to Pro
        </button>
      </div>
    </div>
  );
}
