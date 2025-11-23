interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function Slider({ label, ...props }: SliderProps) {
  return (
    <div className="space-y-2">
      {label && <span className="text-sm text-[--muted-foreground]">{label}</span>}
      <input type="range" className="w-full accent-[--accent-blue]" {...props} />
    </div>
  )
}
