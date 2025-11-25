import * as React from "react";
import { cn } from "@/lib/utils";

export function Avatar({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted", className)} {...props} />;
}

export function AvatarFallback({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("text-sm font-medium text-foreground", className)} {...props}>
      {children}
    </div>
  );
}
