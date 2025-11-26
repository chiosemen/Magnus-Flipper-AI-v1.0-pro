import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface OnboardingBannerProps {
  onDismiss?: () => void;
}

export function OnboardingBanner({ onDismiss }: OnboardingBannerProps) {
  return (
    <Card className="border-amber-500/30 bg-amber-500/10">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-amber-100">Finish onboarding to unlock alerts</CardTitle>
          <p className="text-sm text-amber-50/90">
            Set up your first flip search to start receiving matches.
          </p>
        </div>
        {onDismiss && (
          <Button variant="ghost" className="text-amber-100" onClick={onDismiss}>
            Dismiss
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button className="rounded-full" asChild>
          <a href="/onboarding/first-flip">Resume onboarding</a>
        </Button>
        <Button variant="outline" className="rounded-full border-amber-300 text-amber-100" asChild>
          <a href="/searches/new">Create search</a>
        </Button>
      </CardContent>
    </Card>
  );
}
