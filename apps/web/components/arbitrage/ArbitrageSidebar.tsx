import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ArbitrageSidebar() {
  return (
    <div className="space-y-4">
      <Card className="border-white/10 bg-[#0f131d] text-white">
        <CardHeader>
          <CardTitle className="text-lg">Execution costs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-white/70">
          <p>
            Runs use estimated CUs. Each tier enforces a CU cap to keep usage
            predictable.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="border-white/20 text-white/70">
              CU caps active
            </Badge>
            <Badge variant="outline" className="border-white/20 text-white/70">
              Best-effort runs
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-[#0f131d] text-white">
        <CardHeader>
          <CardTitle className="text-lg">Compliance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-white/70">
          <p>No auto-buying. This view surfaces opportunities only.</p>
          <p className="text-xs text-white/50">
            Decision support, not execution.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
