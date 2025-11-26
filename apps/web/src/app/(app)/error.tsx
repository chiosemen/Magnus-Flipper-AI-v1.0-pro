"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <Card className="border-rose-500/30 bg-rose-500/5">
      <CardHeader>
        <CardTitle className="text-lg text-white">Something went wrong</CardTitle>
        <p className="text-sm text-rose-100/90">{error.message}</p>
      </CardHeader>
      <CardContent>
        <Button onClick={() => reset()}>Try again</Button>
      </CardContent>
    </Card>
  );
}
