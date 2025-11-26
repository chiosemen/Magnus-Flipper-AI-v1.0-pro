"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function StepOne() {
  const router = useRouter();

  return (
    <div className="max-w-xl mx-auto py-12">
      <Card>
        <CardHeader>
          <CardTitle>Welcome to Your First Flip</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            We&apos;ll walk you through creating your first saved search. This helps
            us start monitoring deals for you.
          </p>
          <Button onClick={() => router.push("/onboarding/first-flip/step-2")}>
            Start
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
