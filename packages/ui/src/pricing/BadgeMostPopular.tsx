import { Badge } from "../../../../../apps/web/src/components/ui/badge";

interface BadgeMostPopularProps {
  label?: string;
}

export function BadgeMostPopular({ label = "Most Popular" }: BadgeMostPopularProps) {
  return (
    <Badge className="bg-cyan-500 text-[10px] font-semibold uppercase tracking-wide text-slate-950">
      {label}
    </Badge>
  );
}
