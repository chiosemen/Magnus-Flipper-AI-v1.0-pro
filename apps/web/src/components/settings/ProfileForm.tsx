import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export function ProfileForm() {
  const [name, setName] = useState("Alex Trader");
  const [email, setEmail] = useState("alex@example.com");

  return (
    <Card className="border-none bg-transparent shadow-none">
      <CardContent className="space-y-4 p-0">
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-slate-900/80" />
        </div>
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Email</Label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} className="bg-slate-900/80" />
        </div>
        <Button type="button">Save</Button>
      </CardContent>
    </Card>
  );
}
