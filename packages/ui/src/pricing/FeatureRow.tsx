interface FeatureRowProps {
  text: string;
}

export function FeatureRow({ text }: FeatureRowProps) {
  return (
    <li className="flex items-start gap-2 text-sm text-slate-200">
      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-cyan-400/80" />
      <span>{text}</span>
    </li>
  );
}
