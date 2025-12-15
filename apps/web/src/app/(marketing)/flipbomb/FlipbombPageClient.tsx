"use client";

import { useState, useRef, useEffect } from "react";
import { HeroSection } from "@/components/flipbomb/HeroSection";
import { LeadCaptureForm } from "@/components/flipbomb/LeadCaptureForm";
import { SuccessMessage } from "@/components/flipbomb/SuccessMessage";
import { recordEvent } from "@/lib/analytics";
import { useConversionPath } from "@/lib/hooks/useConversionPath";
import { TrackedLink } from "@/components/marketing/TrackedLink";
import { Button } from "@/components/flipbomb/ui/button";

export function FlipbombPageClient() {
  const [showSuccess, setShowSuccess] = useState(false);
  const [jobId, setJobId] = useState<string>("");
  const formRef = useRef<HTMLDivElement>(null);
  const { trackConversion, trackFormSubmit } = useConversionPath();

  // Track page view
  useEffect(() => {
    recordEvent("flipbomb_page_viewed", {});
  }, []);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSuccess = (newJobId: string) => {
    setJobId(newJobId);
    setShowSuccess(true);
    trackFormSubmit("flipbomb_scan");
    trackConversion({ type: "scan_started", value: undefined, metadata: { jobId: newJobId } });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleReset = () => {
    setShowSuccess(false);
    setJobId("");
    // Scroll back to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (showSuccess) {
    return (
      <main className="min-h-screen">
        <SuccessMessage jobId={jobId} onReset={handleReset} />
        {/* Cross-link to other marketing pages */}
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Prefer instant offers?{" "}
            <TrackedLink href="/sell-used-car" intent="secondary" className="text-primary hover:underline">
              Get dealer offers for your car
            </TrackedLink>
          </p>
          <TrackedLink href="/dashboard" intent="primary">
            <Button variant="outline">View Results in Dashboard</Button>
          </TrackedLink>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <HeroSection onGetStarted={scrollToForm} />
      <LeadCaptureForm formRef={formRef} onSuccess={handleSuccess} />
      {/* Cross-link to other marketing pages */}
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-sm text-muted-foreground">
          Looking for instant offers?{" "}
          <TrackedLink href="/sell-used-car" intent="secondary" className="text-primary hover:underline">
            Get dealer offers for your car
          </TrackedLink>
        </p>
      </div>
    </main>
  );
}

