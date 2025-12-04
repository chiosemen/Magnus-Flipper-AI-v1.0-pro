interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  variant?: "default" | "success" | "warning" | "danger";
}

export function StatCard({ title, value, subtitle, variant = "default" }: StatCardProps) {
  const variantStyles = {
    default: "border-[#2a2a2a]",
    success: "border-green-500/30 bg-green-500/5",
    warning: "border-yellow-500/30 bg-yellow-500/5",
    danger: "border-red-500/30 bg-red-500/5",
  };

  return (
    <div className={`bg-[#1a1a1a] border ${variantStyles[variant]} rounded-lg p-4`}>
      <div className="text-xs text-[#a0a0a0] uppercase tracking-wider mb-2">
        {title}
      </div>
      <div className="text-2xl font-bold text-[#ededed] mb-1">{value}</div>
      {subtitle && <div className="text-xs text-[#666]">{subtitle}</div>}
    </div>
  );
}
