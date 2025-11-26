"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface WizardStepNotificationsProps {
  value: string[];
  onChange: (next: string[]) => void;
  onNext: () => void;
}

const CHANNELS = [
  { id: "web", label: "Web alerts" },
  { id: "email", label: "Email" },
  { id: "push", label: "Mobile push (if enabled)" },
];

export function WizardStepNotifications({ value, onChange, onNext }: WizardStepNotificationsProps) {
  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  };

  return (
    <Card className="border-slate-800 bg-slate-950/80">
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <p className="text-sm text-slate-300">Pick how you want to be notified.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-3">
          {CHANNELS.map((ch) => {
            const active = value.includes(ch.id);
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => toggle(ch.id)}
                className={`rounded-lg border px-4 py-3 text-left ${
                  active
                    ? "border-cyan-400 bg-cyan-500/10 text-cyan-100"
                    : "border-slate-800 bg-slate-900/70 text-slate-200"
                }`}
              >
                {ch.label}
              </button>
            );
          })}
        </div>
        <Button className="rounded-full" onClick={onNext} disabled={value.length === 0}>
          Continue
        </Button>
      </CardContent>
    </Card>
  );
}
