"use client";

import { useState } from "react";
import { UsedCarForm } from "@/components/used-car/UsedCarForm";
import type { UsedCarFormData } from "@/types/usedCarLead";
import type { PriceEstimate } from "@/components/used-car/types";
import { recordEvent } from "@/lib/analytics";
import { toast } from "sonner";
import { useConversionPath } from "@/lib/hooks/useConversionPath";
import { TrackedLink } from "@/components/marketing/TrackedLink";
import { Button } from "@/components/flipbomb/ui/button";

export function UsedCarFormClient() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { trackConversion, trackFormSubmit, trackFailure } = useConversionPath();

  const handleEstimate = (data: UsedCarFormData) => {
    // Track when user fills out form (for analytics)
    recordEvent("used_car_form_updated", {
      make: data.make,
      model: data.model,
      year: data.year,
    });
  };

  const handleSubmit = async (data: UsedCarFormData, estimate: PriceEstimate) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/lead/used-car", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          estimatedRetail: estimate.estimatedRetail,
          estimatedOfferLow: estimate.estimatedOfferLow,
          estimatedOfferHigh: estimate.estimatedOfferHigh,
          source: "sell-used-car-page",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit");
      }

      const result = await response.json();

      // Track successful submission
      recordEvent("get_dealer_offers_clicked", {
        make: data.make,
        model: data.model,
        year: data.year,
        leadId: result.leadId,
      });

      trackFormSubmit("used_car_lead");
      trackConversion({
        type: "lead_submitted",
        value: result.estimatedOfferMid,
        metadata: {
          make: data.make,
          model: data.model,
          year: data.year,
          leadId: result.leadId,
        },
      });

      toast.success("Lead submitted successfully!", {
        description: `Estimated dealer offer: $${result.estimatedOfferMid.toLocaleString()}`,
      });
    } catch (error) {
      console.error("Submission error:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      trackFailure(errorMessage, {
        make: data.make,
        model: data.model,
        year: data.year,
      });
      toast.error("Failed to submit lead", {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <UsedCarForm
      onEstimate={handleEstimate}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    />
  );
}
