interface ChartShellProps {
  title: string;
  height?: number;
  locked?: boolean;
}

export function ChartShell({ title, height = 300 }: ChartShellProps) {
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#3a3a3a] rounded-lg p-5 transition-smooth">
      <h3 className="text-sm font-semibold text-[#ededed] mb-3 tracking-tight">{title}</h3>
      <div
        className="flex items-center justify-center bg-[#0a0a0a] rounded border border-[#2a2a2a] text-[#666] text-xs"
        style={{ height: `${height}px` }}
      >
        Chart Placeholder
      </div>
    </div>
  );
}
