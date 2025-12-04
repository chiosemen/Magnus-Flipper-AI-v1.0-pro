interface MetricCardProps {
  label: string;
  value: string | number;
  change?: string;
  icon?: string;
  locked?: boolean;
}

export function MetricCard({ label, value, change, icon, locked }: MetricCardProps) {
  if (locked) {
    return (
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 relative overflow-hidden">
        <div className="opacity-30">
          <div className="text-sm text-[#a0a0a0] mb-1">{label}</div>
          <div className="text-3xl font-bold text-[#ededed]">--</div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a]/80 backdrop-blur-sm">
          <div className="text-center">
            <div className="text-4xl mb-2">🔒</div>
            <div className="text-xs text-[#a0a0a0]">Upgrade to unlock</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 hover:border-[#3a3a3a] transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="text-sm text-[#a0a0a0]">{label}</div>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>
      <div className="text-3xl font-bold text-[#ededed] mb-2">{value}</div>
      {change && (
        <div className={`text-sm ${change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
          {change}
        </div>
      )}
    </div>
  );
}
