"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";

export default function Completed() {
  const router = useRouter();

  return (
    <div className="max-w-xl mx-auto py-16">
      <Card>
        <CardHeader>
          <CardTitle>Your First Search Is Live 🎉</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            We’ve started monitoring listings based on your criteria.
            You will begin receiving alerts as soon as new deals appear.
          </p>
          <Button onClick={() => router.push("/searches")}>Go to My Searches</Button>
        </CardContent>
      </Card>
    </div>
  );
}
