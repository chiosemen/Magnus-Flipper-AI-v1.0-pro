import { SectionHeader } from "@/components/ui/SectionHeader";
import { MetricCard } from "@/components/ui/MetricCard";
import { StatCard } from "@/components/ui/StatCard";
import { TableShell } from "@/components/ui/TableShell";
import { ChartShell } from "@/components/ui/ChartShell";

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <SectionHeader
        title="Admin Control Center"
        subtitle="Platform-wide analytics and system management"
        action={
          <div className="flex items-center gap-2">
            <button className="bg-red-600/20 border border-red-600/30 hover:bg-red-600/30 px-4 py-2 rounded-lg text-sm text-red-400 transition-colors">
              System Alerts (3)
            </button>
            <button className="bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#3a3a3a] px-4 py-2 rounded-lg text-sm text-[#ededed] transition-colors">
              Settings
            </button>
          </div>
        }
      />

      {/* Platform Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <MetricCard
          label="Total Users"
          value="1,247"
          change="+15.3%"
          icon="👥"
        />
        <MetricCard
          label="Active Subscriptions"
          value="892"
          change="+8.7%"
          icon="💳"
        />
        <MetricCard
          label="Platform Revenue"
          value="£42,340"
          change="+22.1%"
          icon="💰"
        />
        <MetricCard label="API Requests" value="1.2M" change="+5.2%" icon="📡" />
        <MetricCard label="System Health" value="99.8%" icon="✅" />
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard title="Free Users" value="355" variant="default" />
        <StatCard title="Pro Users" value="478" variant="success" />
        <StatCard title="Agency Users" value="59" variant="success" />
        <StatCard title="Admin Users" value="3" variant="warning" />
        <StatCard title="Churn Rate" value="2.3%" variant="danger" />
      </div>

      {/* System Health & Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartShell title="User Growth (30d)" height={220} />
        <ChartShell title="Revenue Breakdown" height={220} />
        <ChartShell title="API Performance" height={220} />
      </div>

      {/* Scraper Status */}
      <div>
        <h3 className="text-lg font-semibold text-[#ededed] mb-4">
          Scraper Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-[#1a1a1a] border border-green-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#a0a0a0]">eBay</span>
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            </div>
            <div className="text-xl font-bold text-[#ededed]">Active</div>
            <div className="text-xs text-[#666]">Last run: 2m ago</div>
          </div>
          <div className="bg-[#1a1a1a] border border-green-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#a0a0a0]">Facebook</span>
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            </div>
            <div className="text-xl font-bold text-[#ededed]">Active</div>
            <div className="text-xs text-[#666]">Last run: 5m ago</div>
          </div>
          <div className="bg-[#1a1a1a] border border-green-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#a0a0a0]">Gumtree</span>
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            </div>
            <div className="text-xl font-bold text-[#ededed]">Active</div>
            <div className="text-xs text-[#666]">Last run: 3m ago</div>
          </div>
          <div className="bg-[#1a1a1a] border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#a0a0a0]">Vinted</span>
              <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
            </div>
            <div className="text-xl font-bold text-[#ededed]">Slow</div>
            <div className="text-xs text-[#666]">Last run: 15m ago</div>
          </div>
          <div className="bg-[#1a1a1a] border border-red-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#a0a0a0]">Craigslist</span>
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            </div>
            <div className="text-xl font-bold text-[#ededed]">Error</div>
            <div className="text-xs text-[#666]">Last run: 45m ago</div>
          </div>
        </div>
      </div>

      {/* Recent Users Table */}
      <div>
        <h3 className="text-lg font-semibold text-[#ededed] mb-4">
          Recent User Activity
        </h3>
        <TableShell
          headers={["User", "Tier", "Last Active", "Revenue", "Actions"]}
        >
          <tr>
            <td className="px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  AJ
                </div>
                <div>
                  <div className="text-sm font-medium text-[#ededed]">
                    Alice J.
                  </div>
                  <div className="text-xs text-[#666]">alice@example.com</div>
                </div>
              </div>
            </td>
            <td className="px-6 py-4">
              <span className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-500">
                Agency
              </span>
            </td>
            <td className="px-6 py-4 text-sm text-[#a0a0a0]">2 min ago</td>
            <td className="px-6 py-4 text-sm text-green-500">£149/mo</td>
            <td className="px-6 py-4 text-sm">
              <button className="text-blue-500 hover:text-blue-400 mr-3">
                View
              </button>
              <button className="text-red-500 hover:text-red-400">
                Suspend
              </button>
            </td>
          </tr>
          <tr>
            <td className="px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  BM
                </div>
                <div>
                  <div className="text-sm font-medium text-[#ededed]">Bob M.</div>
                  <div className="text-xs text-[#666]">bob@example.com</div>
                </div>
              </div>
            </td>
            <td className="px-6 py-4">
              <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-500">
                Pro
              </span>
            </td>
            <td className="px-6 py-4 text-sm text-[#a0a0a0]">5 min ago</td>
            <td className="px-6 py-4 text-sm text-green-500">£29/mo</td>
            <td className="px-6 py-4 text-sm">
              <button className="text-blue-500 hover:text-blue-400 mr-3">
                View
              </button>
              <button className="text-red-500 hover:text-red-400">
                Suspend
              </button>
            </td>
          </tr>
          <tr>
            <td className="px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  CD
                </div>
                <div>
                  <div className="text-sm font-medium text-[#ededed]">
                    Charlie D.
                  </div>
                  <div className="text-xs text-[#666]">charlie@example.com</div>
                </div>
              </div>
            </td>
            <td className="px-6 py-4">
              <span className="text-xs px-2 py-1 rounded bg-gray-500/20 text-gray-500">
                Free
              </span>
            </td>
            <td className="px-6 py-4 text-sm text-[#a0a0a0]">1 hour ago</td>
            <td className="px-6 py-4 text-sm text-[#666]">£0/mo</td>
            <td className="px-6 py-4 text-sm">
              <button className="text-blue-500 hover:text-blue-400 mr-3">
                View
              </button>
              <button className="text-red-500 hover:text-red-400">
                Suspend
              </button>
            </td>
          </tr>
        </TableShell>
      </div>

      {/* System Logs */}
      <div>
        <h3 className="text-lg font-semibold text-[#ededed] mb-4">
          System Activity Log
        </h3>
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg font-mono text-xs">
          <div className="p-4 space-y-2">
            <div className="text-green-500">
              [12:45:23] INFO: eBay scraper completed successfully - 342 new
              listings
            </div>
            <div className="text-green-500">
              [12:44:18] INFO: Facebook scraper completed - 198 new listings
            </div>
            <div className="text-yellow-500">
              [12:43:01] WARN: Vinted scraper slow response - 8.2s average
            </div>
            <div className="text-red-500">
              [12:40:45] ERROR: Craigslist scraper failed - Connection timeout
            </div>
            <div className="text-blue-500">
              [12:38:12] INFO: User alice@example.com upgraded to Agency tier
            </div>
            <div className="text-green-500">
              [12:35:09] INFO: Database backup completed successfully
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
