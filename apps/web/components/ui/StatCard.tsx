interface StatCardProps {
  title: string;
  value: string | number;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export function StatCard({ title, value, variant = 'default' }: StatCardProps) {
  const variantStyles = {
    default: 'border-[#2a2a2a] hover:border-[#3a3a3a]',
    success: 'border-green-500/30 hover:border-green-500/40',
    warning: 'border-yellow-500/30 hover:border-yellow-500/40',
    danger: 'border-red-500/30 hover:border-red-500/40',
  };

  return (
    <div className={`bg-[#1a1a1a] border ${variantStyles[variant]} rounded-lg p-3.5 transition-smooth hover-lift`}>
      <div className="text-xs text-[#a0a0a0] uppercase tracking-wide font-medium mb-1.5">{title}</div>
      <div className="text-xl font-bold text-[#ededed]">{value}</div>
    </div>
  );
}
