'use client';

interface RevisionCardProps {
  revisions?: {
    stable?: string;
    canary?: string;
    traffic?: string;
  };
}

export function RevisionCard({ revisions }: RevisionCardProps) {
  const stable = revisions?.stable || '-';
  const canary = revisions?.canary || '-';
  const traffic = revisions?.traffic || '-';

  return (
    <div className="bg-card rounded-lg border p-6 space-y-4">
      <h2 className="text-2xl font-semibold">🌀 Revisions</h2>
      
      <div className="space-y-3">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Stable Revision:</p>
          <p className="font-mono text-sm bg-background p-2 rounded">
            {stable}
          </p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-1">Canary Revision:</p>
          <p className="font-mono text-sm bg-background p-2 rounded">
            {canary}
          </p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-1">Traffic Split:</p>
          <p className="font-semibold text-lg">{traffic}</p>
        </div>
      </div>

      <div className="pt-4 border-t">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-blue-500" />
            <span className="text-sm">Stable</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-purple-500" />
            <span className="text-sm">Canary</span>
          </div>
        </div>
      </div>
    </div>
  );
}
