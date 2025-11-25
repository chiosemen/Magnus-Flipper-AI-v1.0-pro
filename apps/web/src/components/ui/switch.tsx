import * as React from "react";
import { cn } from "@/lib/utils";

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  onCheckedChange?: (checked: boolean) => void;
}

export function Switch({ label, className, onCheckedChange, ...props }: SwitchProps) {
  return (
    <label className="flex items-center gap-2">
      <input
        type="checkbox"
        className="h-4 w-4 rounded accent-cyan-500"
        {...props}
        onChange={(e) => {
          props.onChange?.(e);
          onCheckedChange?.(e.target.checked);
        }}
      />
      {label && <span className={cn("text-sm text-muted-foreground", className)}>{label}</span>}
    </label>
  );
}
