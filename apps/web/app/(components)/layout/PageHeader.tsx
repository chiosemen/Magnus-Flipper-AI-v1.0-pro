"use client";

import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  /**
   * Title variant/size
   * @default "h2"
   */
  titleVariant?: "h1" | "h2" | "h3" | "h4";
}

export function PageHeader({ 
  title, 
  subtitle, 
  actions,
  titleVariant = "h2"
}: PageHeaderProps) {
  const titleClass = {
    h1: "text-h1",
    h2: "text-h2",
    h3: "text-h3",
    h4: "text-h4",
  }[titleVariant];

  return (
    <div className="flex flex-col gap-2 border-b border-border/60 pb-4 mb-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className={`${titleClass} text-foreground font-heading`}>{title}</h1>
          {subtitle ? (
            <p className="text-body-m text-muted-foreground mt-1">{subtitle}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
        ) : null}
      </div>
    </div>
  );
}
