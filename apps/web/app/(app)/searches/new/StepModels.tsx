import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getModelsForManufacturer } from "@magnus-flipper-ai/ui-config";

interface StepModelsProps {
  manufacturer: string;
  value: string[];
  onToggle: (model: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepModels({ manufacturer, value, onToggle, onNext, onBack }: StepModelsProps) {
  const seriesList = manufacturer ? getModelsForManufacturer(manufacturer) : [];

  return (
    <Card className="border-border/40 bg-slate-950/70">
      <CardHeader>
        <CardTitle>Select models (optional)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {seriesList.map((series: { series: string; models: string[] }) => (
            <div key={series.series} className="rounded-xl border border-border/40 bg-slate-900/50 p-4">
              <p className="text-sm font-semibold text-foreground">{series.series}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {series.models.map((model: string) => {
                  const selected = value.includes(model);
                  return (
                    <button
                      key={model}
                      onClick={() => onToggle(model)}
                      className={`rounded-full px-3 py-2 text-sm transition ${
                        selected
                          ? "border border-cyan-500 bg-cyan-500/15 text-cyan-50"
                          : "border border-border/60 bg-slate-900/70 text-foreground hover:border-cyan-500/50"
                      }`}
                    >
                      {model}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {!seriesList.length && (
            <p className="text-sm text-muted-foreground">Choose a manufacturer to see models.</p>
          )}
        </div>
        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button onClick={onNext}>Continue</Button>
        </div>
      </CardContent>
    </Card>
  );
}
