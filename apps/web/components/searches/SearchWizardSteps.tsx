export function SearchWizardSteps({ step }: { step: number }) {
  // TODO: Replace with actual step content; currently shows simple progress
  const steps = ['Category', 'Manufacturer', 'Models', 'Filters', 'Review']
  return (
    <div className="flex items-center gap-3">
      {steps.map((label, idx) => (
        <div key={label} className="flex items-center gap-2">
          <div
            className={`grid h-8 w-8 place-items-center rounded-full border ${
              idx === step
                ? 'border-[--accent-blue] text-[--accent-blue]'
                : idx < step
                ? 'border-green-500 text-green-400'
                : 'border-[--border] text-[--muted-foreground]'
            }`}
          >
            {idx + 1}
          </div>
          <span className="text-sm text-[--muted-foreground]">{label}</span>
        </div>
      ))}
    </div>
  )
}
