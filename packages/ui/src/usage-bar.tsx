import React from "react";

export function UsageBar({ value }: { value: number }) {
  const pct = Math.min(100, Math.max(0, value));

  return (
    <div className="w-full">
      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-600 to-cyan-500"
          style={{ width: pct + "%" }}
        />
      </div>
    </div>
  );
}
