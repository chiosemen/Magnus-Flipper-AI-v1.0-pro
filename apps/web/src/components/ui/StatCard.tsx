interface StatCardProps {
  title: string;
  value: string | number;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export function StatCard({ title, value, variant = 'default' }: StatCardProps) {
  const variantStyles = {
    default: 'border-[#2a2a2a]',
    success: 'border-green-500/30',
    warning: 'border-yellow-500/30',
    danger: 'border-red-500/30',
  };

  return (
    <div className={`bg-[#1a1a1a] border ${variantStyles[variant]} rounded-lg p-4`}>
      <div className="text-xs text-[#a0a0a0] mb-1">{title}</div>
      <div className="text-xl font-bold text-[#ededed]">{value}</div>
    </div>
  );
}
