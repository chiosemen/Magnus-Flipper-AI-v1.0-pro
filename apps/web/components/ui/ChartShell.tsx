interface ChartShellProps {
  title: string;
  height?: number;
  locked?: boolean;
}

export function ChartShell({ title, height = 300 }: ChartShellProps) {
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
      <h3 className="text-sm font-semibold text-[#ededed] mb-4">{title}</h3>
      <div
        className="flex items-center justify-center bg-[#0a0a0a] rounded border border-[#2a2a2a] text-[#666]"
        style={{ height: `${height}px` }}
      >
        Chart Placeholder
      </div>
    </div>
  );
}
