import React, { ReactNode } from "react";

export function ErrorState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 ${className || ""}`}>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      {description ? <p className="text-sm text-rose-100/90">{description}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
