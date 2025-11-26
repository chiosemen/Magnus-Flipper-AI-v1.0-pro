"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSavedSearch } from "@/lib/app-api";
import { useRouter } from "next/navigation";

export default function StepThree() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem("firstFlipSearch") : null;
    if (raw) setData(JSON.parse(raw));
  }, []);

  const handleCreate = async () => {
    if (!data) return;
    await createSavedSearch({
      name: data.keywords || "First flip search",
      category: data.marketplace || "custom",
      models: data.keywords ? data.keywords.split(",").map((k: string) => k.trim()).filter(Boolean) : undefined,
      active: true,
    });
    router.push("/onboarding/first-flip/completed");
  };

  if (!data) {
    return <div className="p-6 text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="max-w-xl mx-auto py-12">
      <Card>
        <CardHeader>
          <CardTitle>Confirm Your Search</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p><strong>Keywords:</strong> {data.keywords}</p>
          <p><strong>Marketplace:</strong> {data.marketplace}</p>
          <Button onClick={handleCreate}>Create Search</Button>
        </CardContent>
      </Card>
    </div>
  );
}
