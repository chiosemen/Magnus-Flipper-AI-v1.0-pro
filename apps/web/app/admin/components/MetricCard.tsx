interface MetricCardProps {
  label: string;
  value: string | number;
  change?: string;
  variant?: "default" | "success" | "warning" | "danger";
}

export function MetricCard({
  label,
  value,
  change,
  variant = "default",
}: MetricCardProps) {
  const variantStyles = {
    default: "border-[#2a2a2a]",
    success: "border-green-500/30 bg-green-500/5",
    warning: "border-yellow-500/30 bg-yellow-500/5",
    danger: "border-red-500/30 bg-red-500/5",
  };

  return (
    <div
      className={`bg-[#1a1a1a] border ${variantStyles[variant]} rounded-lg p-6`}
    >
      <div className="text-sm text-[#a0a0a0] mb-2">{label}</div>
      <div className="text-3xl font-bold text-[#ededed] mb-1">{value}</div>
      {change && (
        <div
          className={`text-sm ${
            change.startsWith("+") ? "text-green-500" : "text-red-500"
          }`}
        >
          {change}
        </div>
      )}
    </div>
  );
}
