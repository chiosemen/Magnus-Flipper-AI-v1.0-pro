"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select } from "@/components/ui/select";
import { getMarketplaceColor } from "@/lib/ui/marketplace-ui";

const FREQUENCY_OPTIONS = [
  { id: "realtime", label: "Real-time (as they arrive)" },
  { id: "hourly", label: "Hourly digest" },
  { id: "daily", label: "Daily digest" },
  { id: "weekly", label: "Weekly digest" },
];

interface AlertSettingsProps {
  searchName?: string;
  marketplace?: string;
  enabled?: boolean;
  frequency?: string;
  onEnabledChange?: (enabled: boolean) => void;
  onFrequencyChange?: (frequency: string) => void;
}

export function AlertSettings({
  searchName = "Your Search",
  marketplace,
  enabled = true,
  frequency = "realtime",
  onEnabledChange,
  onFrequencyChange,
}: AlertSettingsProps) {
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [alertFrequency, setAlertFrequency] = useState(frequency);

  const handleToggle = (checked: boolean) => {
    setIsEnabled(checked);
    onEnabledChange?.(checked);
  };

  const handleFrequencyChange = (value: string) => {
    setAlertFrequency(value);
    onFrequencyChange?.(value);
  };

  const marketplaceClass = getMarketplaceColor(marketplace || "");

  return (
    <Card className="border-slate-800 bg-slate-950/80">
      <CardHeader>
        <CardTitle className="text-lg">Alert Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{searchName}</h3>
              {marketplace && (
                <Badge variant="outline" className={`mt-1 capitalize ${marketplaceClass}`}>
                  {marketplace.toLowerCase()}
                </Badge>
              )}
            </div>
            <Switch checked={isEnabled} onCheckedChange={handleToggle} />
          </div>

          {isEnabled && (
            <div className="space-y-2 pt-2">
              <label className="text-sm font-medium">Alert Frequency</label>
              <Select
                value={alertFrequency}
                onChange={(e) => handleFrequencyChange(e.target.value)}
                className="w-full"
              >
                {FREQUENCY_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </div>

        <div className="text-sm text-muted-foreground border-t border-slate-800 pt-4">
          <p>
            {isEnabled
              ? `You will receive alerts ${
                  alertFrequency === "realtime"
                    ? "immediately when new matches are found"
                    : FREQUENCY_OPTIONS.find((o) => o.id === alertFrequency)?.label.toLowerCase()
                }.`
              : "Alerts are currently disabled for this search."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
