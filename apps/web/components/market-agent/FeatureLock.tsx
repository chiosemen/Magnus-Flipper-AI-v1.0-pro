import { Lock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

export type MarketAgentFeature =
  | 'auto_refresh'
  | 'verified_badge'
  | 'live_capture'
  | 'priority_concurrency';

export const FEATURE_COPY: Record<MarketAgentFeature, string> = {
  auto_refresh: 'Auto-refresh requires an active Market Agent subscription.',
  verified_badge: 'Verification signals are available on Market Agent.',
  live_capture: 'Live Capture is available with Market Agent.',
  priority_concurrency: 'Priority processing is part of Market Agent.',
};

export function FeatureLock({ feature }: { feature: MarketAgentFeature }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger className="inline-flex items-center text-neutral-400">
          <Lock className="h-4 w-4" />
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs text-xs">{FEATURE_COPY[feature]}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

