interface ChartShellProps {
  title: string;
  height?: number;
  locked?: boolean;
  children?: React.ReactNode;
}

export function ChartShell({ title, height = 300, locked, children }: ChartShellProps) {
  if (locked) {
    return (
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6 relative overflow-hidden">
        <h3 className="text-sm font-semibold text-[#ededed] mb-4 opacity-30">{title}</h3>
        <div
          className="bg-[#0a0a0a] rounded opacity-30"
          style={{ height: `${height}px` }}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a]/80 backdrop-blur-sm">
          <div className="text-center">
            <div className="text-4xl mb-2">🔒</div>
            <div className="text-sm text-[#a0a0a0]">Upgrade to unlock</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
      <h3 className="text-sm font-semibold text-[#ededed] mb-4">{title}</h3>
      <div
        className="bg-[#0a0a0a] rounded flex items-center justify-center"
        style={{ height: `${height}px` }}
      >
        {children || (
          <div className="text-[#666] text-sm">Chart placeholder</div>
        )}
      </div>
    </div>
  );
}
