import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

type BadgeVariant = 'verified' | 'live-capture' | 'recent' | 'in-progress';

const BADGE_COPY: Record<BadgeVariant, string> = {
  verified: 'Details verified against source listing. Updated recently.',
  'live-capture': 'Captured from a live marketplace session moments ago.',
  recent: 'Recently observed listing. Updated within the last few minutes.',
  'in-progress': 'Additional signals are being checked in the background.',
};

const BADGE_LABEL: Record<BadgeVariant, string> = {
  verified: 'VERIFIED',
  'live-capture': 'LIVE CAPTURE',
  recent: 'RECENT',
  'in-progress': 'IN PROGRESS',
};

const badgeBase =
  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wide uppercase leading-none border';

const badgeStyles: Record<BadgeVariant, string> = {
  verified:
    'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700/60',
  'live-capture':
    'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-700/60',
  recent:
    'bg-violet-50 text-violet-800 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-700/60',
  'in-progress':
    'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700/60',
};

export function MarketBadge({ variant }: { variant: BadgeVariant }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`${badgeBase} ${badgeStyles[variant]}`}>{BADGE_LABEL[variant]}</span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs text-xs">{BADGE_COPY[variant]}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

