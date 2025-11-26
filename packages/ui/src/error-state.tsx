"use client";

import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../apps/web/src/components/ui/card";
import { cn } from "../../apps/web/src/lib/utils";

interface ErrorStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function ErrorState({ title, description, action, className }: ErrorStateProps) {
  return (
    <Card className={cn("border-rose-500/30 bg-rose-500/5", className)}>
      <CardHeader>
        <CardTitle className="text-lg text-white">{title}</CardTitle>
        {description && <p className="text-sm text-rose-100/90">{description}</p>}
      </CardHeader>
      {action && <CardContent>{action}</CardContent>}
    </Card>
  );
}
