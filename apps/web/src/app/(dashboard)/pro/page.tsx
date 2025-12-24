import { SectionHeader } from "@/components/ui/SectionHeader";
import { MetricCard } from "@/components/ui/MetricCard";
import { StatCard } from "@/components/ui/StatCard";
import { FeedCard } from "@/components/ui/FeedCard";
import { ChartShell } from "@/components/ui/ChartShell";

export default function ProDashboard() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Pro Dashboard"
        subtitle="Real-time marketplace arbitrage opportunities"
        action={
          <button className="bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#3a3a3a] px-4 py-2 rounded-lg text-sm text-[#ededed] transition-smooth active-press font-medium">
            Refresh Feed
          </button>
        }
      />

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Total Profit" value="£1,247" change="+12.3%" icon="💰" />
        <MetricCard label="Active Listings" value="34" change="+5" icon="📦" />
        <MetricCard label="ROI Average" value="18.5%" change="+2.1%" icon="📊" />
        <MetricCard label="Searches Today" value="142" icon="🔍" />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard title="Best ROI Today" value="42.3%" variant="success" />
        <StatCard title="Avg Response" value="2.3s" variant="default" />
        <StatCard title="Markets" value="5" variant="default" />
        <StatCard title="Saved" value="12" variant="default" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartShell title="7-Day Profit Trend" height={220} />
        <ChartShell title="Marketplace Distribution" height={220} />
      </div>

      {/* Live Feed */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-[#ededed]">
            Live Opportunities
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-[#a0a0a0]">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
            <span className="font-medium">Live</span>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <FeedCard
            title="PlayStation 5 Console Digital Edition"
            price={280}
            marketValue={420}
            profit={45}
            roi={16.1}
            marketplace="Facebook"
            timestamp="2 min ago"
          />
          <FeedCard
            title="iPhone 15 Pro 256GB Unlocked"
            price={650}
            marketValue={899}
            profit={89}
            roi={13.7}
            marketplace="eBay"
            timestamp="5 min ago"
          />
          <FeedCard
            title="MacBook Air M2 2024"
            price={850}
            marketValue={1199}
            profit={124}
            roi={14.6}
            marketplace="Gumtree"
            timestamp="8 min ago"
          />
          <FeedCard
            title="Nintendo Switch OLED Bundle"
            price={220}
            marketValue={329}
            profit={34}
            roi={15.5}
            marketplace="Vinted"
            timestamp="12 min ago"
          />
        </div>
      </div>
    </div>
  );
}
