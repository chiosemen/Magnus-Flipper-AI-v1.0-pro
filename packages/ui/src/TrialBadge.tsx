import * as React from 'react';

type TrialBadgeProps = {
  expiresAt?: string | null;
};

export function TrialBadge({ expiresAt }: TrialBadgeProps) {
  return (
    <span className="inline-flex items-center rounded-full bg-blue-500/15 px-3 py-1 text-xs font-semibold text-blue-100">
      Trial{expiresAt ? ` ends ${expiresAt}` : ""}
    </span>
  );
}
