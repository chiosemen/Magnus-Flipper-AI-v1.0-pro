"use client";

export function TopNav() {
  return (
    <header className="h-16 bg-[#0a0a0a] border-b border-[#2a2a2a] fixed top-0 right-0 left-64 z-10">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Search */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <input
              type="text"
              placeholder="Search listings, keywords, marketplaces..."
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-2 text-sm text-[#ededed] placeholder-[#666] focus:outline-none focus:border-[#3a3a3a]"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666]">
              🔍
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative p-2 hover:bg-[#1a1a1a] rounded-lg transition-colors">
            <span className="text-xl">🔔</span>
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User Menu */}
          <button className="flex items-center gap-3 p-2 hover:bg-[#1a1a1a] rounded-lg transition-colors">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
              U
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-[#ededed]">User</div>
              <div className="text-xs text-[#666]">Free Tier</div>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
