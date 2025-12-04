export function TopNav() {
  return (
    <header className="h-16 border-b border-[#2a2a2a] bg-[#0a0a0a] flex items-center justify-between px-8">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-[#ededed]">Magnus Flipper AI</h1>
      </div>
      <div className="flex items-center gap-4">
        <button className="px-4 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-sm text-[#ededed] hover:border-[#3a3a3a] transition-colors">
          Notifications
        </button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600"></div>
      </div>
    </header>
  );
}
