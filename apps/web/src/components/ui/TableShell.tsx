import type { ReactNode } from 'react';

interface TableShellProps {
  headers: string[];
  children: ReactNode;
}

export function TableShell({ headers, children }: TableShellProps) {
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-[#0a0a0a] border-b border-[#2a2a2a]">
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                className="px-6 py-3 text-left text-xs font-medium text-[#a0a0a0] uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#2a2a2a]">
          {children}
        </tbody>
      </table>
    </div>
  );
}
