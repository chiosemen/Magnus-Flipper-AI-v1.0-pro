import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";

export function NotificationsForm() {
  const [email, setEmail] = useState(true);
  const [push, setPush] = useState(true);
  const [sms, setSms] = useState(false);

  return (
    <Card className="border-none bg-transparent shadow-none">
      <CardContent className="space-y-4 p-0">
        <div className="flex items-center justify-between rounded-lg border border-border/40 bg-slate-900/60 px-4 py-3">
          <div>
            <Label className="text-sm text-foreground">Email</Label>
            <p className="text-xs text-muted-foreground">Get alerts and account updates</p>
          </div>
          <Switch checked={email} onCheckedChange={setEmail} />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border/40 bg-slate-900/60 px-4 py-3">
          <div>
            <Label className="text-sm text-foreground">Push</Label>
            <p className="text-xs text-muted-foreground">Instant notifications for matches</p>
          </div>
          <Switch checked={push} onCheckedChange={setPush} />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border/40 bg-slate-900/60 px-4 py-3">
          <div>
            <Label className="text-sm text-foreground">SMS</Label>
            <p className="text-xs text-muted-foreground">Text messages for high-score alerts</p>
          </div>
          <Switch checked={sms} onCheckedChange={setSms} />
        </div>
        <Button type="button">Save preferences</Button>
      </CardContent>
    </Card>
  );
}
