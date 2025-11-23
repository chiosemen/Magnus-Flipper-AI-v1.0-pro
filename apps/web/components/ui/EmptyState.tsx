export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-[--border] bg-[--surface] p-6 text-center">
      <h3 className="text-lg font-semibold text-[--foreground]">{title}</h3>
      {description && <p className="mt-2 text-sm text-[--muted-foreground]">{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  )
}
