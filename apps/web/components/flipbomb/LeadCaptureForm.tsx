"use client";

import { useState } from "react";
import { Button } from "@/components/flipbomb/ui/button";
import { Input } from "@/components/flipbomb/ui/input";
import { Label } from "@/components/flipbomb/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/flipbomb/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/flipbomb/ui/card";
import { Smartphone, DollarSign, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import type { FlipbombScanPayload } from "@/types/flipbombScan";
import { recordEvent } from "@/lib/analytics";
import { useConversionPath } from "@/lib/hooks/useConversionPath";

const PHONE_BRANDS = ["Apple", "Samsung", "Google", "OnePlus", "Xiaomi", "Huawei", "Other"];
const STORAGE_OPTIONS = ["32GB", "64GB", "128GB", "256GB", "512GB", "1TB"];
const CONDITIONS = [
  { value: "excellent", label: "Excellent - Like new, no scratches" },
  { value: "good", label: "Good - Minor wear, fully functional" },
  { value: "fair", label: "Fair - Visible wear, works fine" },
  { value: "poor", label: "Poor - Damaged but functional" },
];

interface LeadCaptureFormProps {
  formRef: React.RefObject<HTMLDivElement>;
  onSuccess: (jobId: string) => void;
}

export function LeadCaptureForm({ formRef, onSuccess: _onSuccess }: LeadCaptureFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { trackFailure } = useConversionPath();

  const [formData, setFormData] = useState<FlipbombScanPayload>({
    brand: "",
    model: "",
    storage: "",
    condition: "",
    maxPrice: undefined,
    region: "US",
  });

  const handleInputChange = (field: keyof FlipbombScanPayload, value: string | number | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.brand || !formData.model || !formData.condition) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      // Guardrail: UI must never trigger scraping. Flipbomb "scan" is deprecated in pooled mode.
      toast.error("Live scans are disabled. Create a saved search in the Marketplace page instead.");
      recordEvent("flipbomb_scan_blocked", {
        brand: formData.brand,
        model: formData.model,
        condition: formData.condition,
        maxPrice: formData.maxPrice,
      });
      return;
    } catch (error) {
      console.error("Scan submission error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to start deal scan";
      toast.error(errorMessage);
      
      // Track failure
      recordEvent("flipbomb_scan_failed", {
        brand: formData.brand,
        model: formData.model,
        error: errorMessage,
      });

      trackFailure(errorMessage, {
        brand: formData.brand,
        model: formData.model,
        condition: formData.condition,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section ref={formRef} className="px-4 py-16 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Start Your Deal Scan
        </h2>
        <p className="text-muted-foreground">
          Enter product details to scan marketplaces for deals and arbitrage opportunities
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Details */}
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Smartphone className="w-5 h-5 text-primary" />
              Product Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Brand *</Label>
                <Select value={formData.brand} onValueChange={(v) => handleInputChange("brand", v)}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {PHONE_BRANDS.map((brand) => (
                      <SelectItem key={brand} value={brand.toLowerCase()}>
                        {brand}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model *</Label>
                <Input
                  id="model"
                  placeholder="e.g. iPhone 14 Pro"
                  value={formData.model}
                  onChange={(e) => handleInputChange("model", e.target.value)}
                  className="bg-background"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Storage</Label>
                <Select value={formData.storage || ""} onValueChange={(v) => handleInputChange("storage", v || undefined)}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select storage" />
                  </SelectTrigger>
                  <SelectContent>
                    {STORAGE_OPTIONS.map((storage) => (
                      <SelectItem key={storage} value={storage.toLowerCase()}>
                        {storage}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Condition *</Label>
                <Select value={formData.condition} onValueChange={(v) => handleInputChange("condition", v)}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONDITIONS.map((condition) => (
                      <SelectItem key={condition.value} value={condition.value}>
                        {condition.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Price Filter */}
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="w-5 h-5 text-primary" />
              Price Filter (Optional)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="maxPrice">Maximum Price</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="maxPrice"
                  type="number"
                  placeholder="e.g. 500"
                  value={formData.maxPrice || ""}
                  onChange={(e) => handleInputChange("maxPrice", e.target.value ? Number(e.target.value) : undefined)}
                  className="pl-9 bg-background"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Only show deals below this price
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="w-full text-lg py-6 font-semibold hover:scale-[1.02] transition-transform"
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
              Starting Scan...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5 mr-2" />
              Start Deal Scan
            </>
          )}
        </Button>
      </form>
    </section>
  );
}
