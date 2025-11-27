import React from "react";

export function EmptyState({
  title,
  description
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="text-center py-16 opacity-80">
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 max-w-sm mx-auto">{description}</p>
      )}
    </div>
  );
}
