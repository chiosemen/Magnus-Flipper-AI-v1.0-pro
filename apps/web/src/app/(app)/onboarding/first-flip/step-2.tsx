"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";

export default function StepTwo() {
  const router = useRouter();
  const [keywords, setKeywords] = useState("");
  const [marketplace, setMarketplace] = useState("");

  const handleNext = () => {
    const payload = { keywords, marketplace };
    localStorage.setItem("firstFlipSearch", JSON.stringify(payload));
    router.push("/onboarding/first-flip/step-3");
  };

  return (
    <div className="max-w-xl mx-auto py-12">
      <Card>
        <CardHeader>
          <CardTitle>Define Your Search</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Keywords (e.g. iPhone 13, sofa, Toyota Corolla)"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
          />
          <Input
            placeholder="Marketplace (e.g. Facebook, Craigslist)"
            value={marketplace}
            onChange={(e) => setMarketplace(e.target.value)}
          />
          <Button onClick={handleNext}>Next</Button>
        </CardContent>
      </Card>
    </div>
  );
}
