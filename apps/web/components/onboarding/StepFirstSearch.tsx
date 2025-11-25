import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface StepFirstSearchProps {
  onNext: () => void;
  onBack: () => void;
}

export function StepFirstSearch({ onNext, onBack }: StepFirstSearchProps) {
  const [name, setName] = useState("My First Flip");
  const [keywords, setKeywords] = useState("iPhone, MacBook, PS5");

  return (
    <Card className="border-border/40 bg-slate-950/70">
      <CardHeader>
        <CardTitle>Create your first search</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Search name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-slate-900/80" />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-muted-foreground">Keywords (comma separated)</label>
          <Input
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            className="bg-slate-900/80"
            placeholder="iphone 15, macbook m2, ps5"
          />
        </div>
        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button onClick={onNext}>Save search</Button>
        </div>
      </CardContent>
    </Card>
  );
}
