import { SectionHeader } from "@/components/ui/SectionHeader";
import { MetricCard } from "@/components/ui/MetricCard";
import { StatCard } from "@/components/ui/StatCard";
import { TableShell } from "@/components/ui/TableShell";
import { ChartShell } from "@/components/ui/ChartShell";

export default function AgencyDashboard() {
  return (
    <div className="space-y-8">
      <SectionHeader
        title="Agency Dashboard"
        subtitle="Team performance and multi-user analytics"
        action={
          <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm text-white transition-colors">
            + Invite Team Member
          </button>
        }
      />

      {/* Team Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <MetricCard label="Team Revenue" value="£8,945" change="+23.4%" icon="💰" />
        <MetricCard label="Active Members" value="8" icon="👥" />
        <MetricCard label="Total Listings" value="156" change="+18" icon="📦" />
        <MetricCard label="Avg Team ROI" value="21.3%" change="+3.2%" icon="📊" />
        <MetricCard label="Team Searches" value="1,247" icon="🔍" />
      </div>

      {/* Performance Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Top Performer" value="Sarah K." variant="success" />
        <StatCard title="Team Efficiency" value="94%" variant="success" />
        <StatCard title="Response Time" value="1.8s" variant="default" />
        <StatCard title="Markets Covered" value="12" variant="default" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartShell title="Team Revenue Trend" height={220} />
        <ChartShell title="Member Performance" height={220} />
        <ChartShell title="Market Coverage" height={220} />
      </div>

      {/* Team Members Table */}
      <div>
        <h3 className="text-lg font-semibold text-[#ededed] mb-4">
          Team Members
        </h3>
        <TableShell
          headers={["Member", "Role", "Listings", "Revenue", "ROI", "Status"]}
        >
          <tr>
            <td className="px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  SK
                </div>
                <div>
                  <div className="text-sm font-medium text-[#ededed]">Sarah K.</div>
                  <div className="text-xs text-[#666]">sarah@agency.com</div>
                </div>
              </div>
            </td>
            <td className="px-6 py-4 text-sm text-[#a0a0a0]">Lead Flipper</td>
            <td className="px-6 py-4 text-sm text-[#ededed]">47</td>
            <td className="px-6 py-4 text-sm text-green-500">£2,340</td>
            <td className="px-6 py-4 text-sm text-[#ededed]">24.5%</td>
            <td className="px-6 py-4">
              <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-500">
                Active
              </span>
            </td>
          </tr>
          <tr>
            <td className="px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  JD
                </div>
                <div>
                  <div className="text-sm font-medium text-[#ededed]">John D.</div>
                  <div className="text-xs text-[#666]">john@agency.com</div>
                </div>
              </div>
            </td>
            <td className="px-6 py-4 text-sm text-[#a0a0a0]">Analyst</td>
            <td className="px-6 py-4 text-sm text-[#ededed]">34</td>
            <td className="px-6 py-4 text-sm text-green-500">£1,890</td>
            <td className="px-6 py-4 text-sm text-[#ededed]">19.2%</td>
            <td className="px-6 py-4">
              <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-500">
                Active
              </span>
            </td>
          </tr>
          <tr>
            <td className="px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  MR
                </div>
                <div>
                  <div className="text-sm font-medium text-[#ededed]">Mike R.</div>
                  <div className="text-xs text-[#666]">mike@agency.com</div>
                </div>
              </div>
            </td>
            <td className="px-6 py-4 text-sm text-[#a0a0a0]">Flipper</td>
            <td className="px-6 py-4 text-sm text-[#ededed]">28</td>
            <td className="px-6 py-4 text-sm text-green-500">£1,456</td>
            <td className="px-6 py-4 text-sm text-[#ededed]">18.7%</td>
            <td className="px-6 py-4">
              <span className="text-xs px-2 py-1 rounded bg-yellow-500/20 text-yellow-500">
                Away
              </span>
            </td>
          </tr>
        </TableShell>
      </div>

      {/* Team Activity Feed */}
      <div>
        <h3 className="text-lg font-semibold text-[#ededed] mb-4">
          Recent Team Activity
        </h3>
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg divide-y divide-[#2a2a2a]">
          <div className="p-4 flex items-center gap-3">
            <span className="text-2xl">💰</span>
            <div className="flex-1">
              <div className="text-sm text-[#ededed]">
                <strong>Sarah K.</strong> closed a deal for £340 profit
              </div>
              <div className="text-xs text-[#666]">5 minutes ago</div>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <span className="text-2xl">🔍</span>
            <div className="flex-1">
              <div className="text-sm text-[#ededed]">
                <strong>John D.</strong> created a new saved search
              </div>
              <div className="text-xs text-[#666]">12 minutes ago</div>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <span className="text-2xl">📦</span>
            <div className="flex-1">
              <div className="text-sm text-[#ededed]">
                <strong>Mike R.</strong> added 8 new listings
              </div>
              <div className="text-xs text-[#666]">1 hour ago</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
