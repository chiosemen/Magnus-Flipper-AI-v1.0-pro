"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/flipbomb/ui/card";
import { Button } from "@/components/flipbomb/ui/button";
import { Input } from "@/components/flipbomb/ui/input";
import { Label } from "@/components/flipbomb/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/flipbomb/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/flipbomb/ui/form";
import type { UsedCarFormProps } from "./types";
import type { UsedCarFormData, VehicleCondition } from "@/types/usedCarLead";
import { PriceEstimator } from "./PriceEstimator";
import type { PriceEstimate } from "./types";

const CAR_MAKES = [
  "Toyota",
  "Honda",
  "Ford",
  "Chevrolet",
  "Nissan",
  "BMW",
  "Mercedes-Benz",
  "Audi",
  "Lexus",
  "Hyundai",
  "Kia",
  "Mazda",
  "Subaru",
  "Volkswagen",
  "Jeep",
  "Ram",
  "GMC",
  "Dodge",
  "Cadillac",
  "Acura",
  "Infiniti",
  "Lincoln",
  "Buick",
  "Chrysler",
  "Other",
];

const CONDITIONS: Array<{ value: VehicleCondition; label: string }> = [
  { value: "excellent", label: "Excellent - Like new, no scratches" },
  { value: "good", label: "Good - Minor wear, fully functional" },
  { value: "fair", label: "Fair - Visible wear, works fine" },
  { value: "poor", label: "Poor - Damaged but functional" },
];

function getYearOptions(): number[] {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let year = currentYear + 1; year >= 1990; year--) {
    years.push(year);
  }
  return years;
}

/**
 * Calculate price estimate from form data
 */
function calculateEstimate(data: UsedCarFormData): PriceEstimate {
  const baseMSRP: Record<string, number> = {
    "Toyota": 35000,
    "Honda": 32000,
    "Ford": 38000,
    "Chevrolet": 36000,
    "Nissan": 30000,
    "BMW": 50000,
    "Mercedes-Benz": 55000,
    "Audi": 48000,
    "Lexus": 45000,
    "Hyundai": 28000,
    "Kia": 27000,
    "Mazda": 29000,
    "Subaru": 33000,
    "Volkswagen": 31000,
    "Jeep": 40000,
    "Ram": 42000,
    "GMC": 40000,
    "Dodge": 35000,
    "Cadillac": 52000,
    "Acura": 38000,
    "Infiniti": 42000,
    "Lincoln": 45000,
    "Buick": 35000,
    "Chrysler": 32000,
    "Other": 35000,
  };

  const basePrice = baseMSRP[data.make] || 35000;
  const currentYear = new Date().getFullYear();
  const age = currentYear - data.year;
  const ageDepreciation = Math.min(age * 0.05, 0.5);
  const expectedMiles = age * 12000;
  const excessMiles = Math.max(0, data.mileage - expectedMiles);
  const mileageDepreciation = Math.min(excessMiles / 200000, 0.3);

  const conditionMultipliers: Record<VehicleCondition, number> = {
    excellent: 1.0,
    good: 0.95,
    fair: 0.85,
    poor: 0.70,
  };

  const conditionMultiplier = conditionMultipliers[data.condition];
  const estimatedRetail = Math.round(
    Math.max(
      basePrice *
        (1 - ageDepreciation - mileageDepreciation) *
        conditionMultiplier,
      1000
    )
  );

  const estimatedOfferLow = Math.round(estimatedRetail * 0.75);
  const estimatedOfferHigh = Math.round(estimatedRetail * 0.85);
  const estimatedOfferMid = Math.round((estimatedOfferLow + estimatedOfferHigh) / 2);
  const priceDelta = estimatedRetail - estimatedOfferMid;

  return {
    estimatedRetail,
    estimatedOfferLow,
    estimatedOfferHigh,
    estimatedOfferMid,
    priceDelta,
  };
}

export function UsedCarForm({ onEstimate, onSubmit, isSubmitting = false }: UsedCarFormProps) {
  const [currentEstimate, setCurrentEstimate] = useState<PriceEstimate | null>(null);
  const form = useForm<UsedCarFormData>({
    defaultValues: {
      make: "",
      model: "",
      year: new Date().getFullYear(),
      mileage: 0,
      condition: "good",
      zip: "",
    },
    mode: "onChange",
  });

  // Validation rules
  const validateMake = (value: string) => value !== "" || "Make is required";
  const validateModel = (value: string) => value.trim() !== "" || "Model is required";
  const validateYear = (value: number) => {
    const currentYear = new Date().getFullYear();
    if (value < 1990) return "Year must be 1990 or later";
    if (value > currentYear + 1) return `Year must be ${currentYear + 1} or earlier`;
    return true;
  };
  const validateMileage = (value: number) => {
    if (value < 0) return "Mileage must be 0 or greater";
    if (value > 500000) return "Mileage must be 500,000 or less";
    return true;
  };
  const validateZip = (value: string) => {
    if (!/^\d{5}$/.test(value)) return "ZIP code must be 5 digits";
    return true;
  };

  const watchedValues = form.watch();

  // Recalculate estimate when form values change
  useEffect(() => {
    const { make, model, year, mileage, condition } = watchedValues;
    if (make && model && year && mileage >= 0 && condition) {
      const estimate = calculateEstimate({
        make,
        model,
        year,
        mileage,
        condition,
        zip: watchedValues.zip,
      });
      setCurrentEstimate(estimate);
      onEstimate({
        make,
        model,
        year,
        mileage,
        condition,
        zip: watchedValues.zip,
      });
    } else {
      setCurrentEstimate(null);
    }
  }, [watchedValues, onEstimate]);

  const handleSubmit = form.handleSubmit(async (data) => {
    if (!currentEstimate) {
      return;
    }
    await onSubmit(data, currentEstimate);
  });

  const yearOptions = getYearOptions();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="make"
                  rules={{ validate: validateMake }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Make</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select make" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CAR_MAKES.map((make) => (
                            <SelectItem key={make} value={make}>
                              {make}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="model"
                  rules={{ validate: validateModel }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Camry, Accord, F-150" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="year"
                  rules={{ validate: validateYear }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value, 10))}
                        value={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select year" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {yearOptions.map((year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="mileage"
                  rules={{ validate: validateMileage }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mileage</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g. 50000"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                        />
                      </FormControl>
                      <FormDescription>Current odometer reading</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="condition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condition</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select condition" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CONDITIONS.map((condition) => (
                            <SelectItem key={condition.value} value={condition.value}>
                              {condition.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="zip"
                  rules={{ validate: validateZip }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ZIP Code</FormLabel>
                      <FormControl>
                        <Input placeholder="12345" maxLength={5} {...field} />
                      </FormControl>
                      <FormDescription>5-digit US ZIP code</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <PriceEstimator formData={watchedValues} />

              <Button type="submit" className="w-full" disabled={isSubmitting || !currentEstimate}>
                {isSubmitting ? "Submitting..." : "Get Dealer Offers"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

