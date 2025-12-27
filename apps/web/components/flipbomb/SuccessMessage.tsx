"use client";

import { Button } from "@/components/flipbomb/ui/button";
import { CheckCircle, ArrowLeft } from "lucide-react";

interface SuccessMessageProps {
  jobId: string;
  onReset: () => void;
}

export function SuccessMessage({ jobId, onReset }: SuccessMessageProps) {
  return (
    <section className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="text-center space-y-6 max-w-md">
        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
          <CheckCircle className="w-10 h-10 text-primary" />
        </div>
        
        <h2 className="text-3xl md:text-4xl font-bold">
          Instant scan started
        </h2>
        
        <p className="text-muted-foreground text-lg">
          Live signal active. Fetching fresh listings that match your criteria.
        </p>

        {jobId && (
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Scan ID</p>
            <p className="font-mono text-sm font-semibold">{jobId}</p>
          </div>
        )}
        
        <div className="pt-4 space-y-4">
          <Button 
            variant="outline" 
            size="lg"
            onClick={onReset}
            className="hover:scale-105 transition-transform"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Run Another Scan
          </Button>
          <div className="text-sm text-muted-foreground">
            <p>
              Track your scan results in{" "}
              <a href="/dashboard" className="text-primary hover:underline">
                Dashboard
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
