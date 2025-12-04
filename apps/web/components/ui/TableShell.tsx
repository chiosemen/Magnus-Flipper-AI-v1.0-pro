interface TableShellProps {
  headers: string[];
  children: React.ReactNode;
  locked?: boolean;
}

export function TableShell({ headers, children, locked }: TableShellProps) {
  if (locked) {
    return (
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg overflow-hidden relative">
        <div className="opacity-30">
          <table className="w-full">
            <thead className="bg-[#0a0a0a] border-b border-[#2a2a2a]">
              <tr>
                {headers.map((header, i) => (
                  <th
                    key={i}
                    className="text-left px-6 py-4 text-xs font-semibold text-[#a0a0a0] uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                {headers.map((_, i) => (
                  <td key={i} className="px-6 py-4 text-sm text-[#ededed]">
                    ---
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
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
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-[#0a0a0a] border-b border-[#2a2a2a]">
          <tr>
            {headers.map((header, i) => (
              <th
                key={i}
                className="text-left px-6 py-4 text-xs font-semibold text-[#a0a0a0] uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#2a2a2a]">{children}</tbody>
      </table>
    </div>
  );
}
