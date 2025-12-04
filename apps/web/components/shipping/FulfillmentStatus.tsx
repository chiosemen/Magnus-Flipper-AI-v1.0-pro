"use client";

/**
 * Fulfillment Status Component
 * Displays fulfillment workflow progress
 */

import { CheckIcon, XIcon, LoaderIcon } from "lucide-react";

interface FulfillmentStep {
  name: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

interface FulfillmentStatusProps {
  steps: FulfillmentStep[];
  currentStep: string;
  status: string;
  loading?: boolean;
}

export function FulfillmentStatus({
  steps,
  currentStep,
  status,
  loading = false,
}: FulfillmentStatusProps) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const getStepIcon = (step: FulfillmentStep) => {
    switch (step.status) {
      case "completed":
        return <CheckIcon className="w-5 h-5 text-white" />;
      case "failed":
        return <XIcon className="w-5 h-5 text-white" />;
      case "in_progress":
        return <LoaderIcon className="w-5 h-5 text-white animate-spin" />;
      default:
        return <div className="w-2 h-2 bg-white rounded-full"></div>;
    }
  };

  const getStepColor = (step: FulfillmentStep) => {
    switch (step.status) {
      case "completed":
        return "bg-green-600 dark:bg-green-500";
      case "failed":
        return "bg-red-600 dark:bg-red-500";
      case "in_progress":
        return "bg-blue-600 dark:bg-blue-500";
      default:
        return "bg-gray-300 dark:bg-gray-600";
    }
  };

  const formatStepName = (name: string) => {
    return name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Fulfillment Status
        </h3>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            status === "completed"
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              : status === "exception"
              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
              : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
          }`}
        >
          {status.replace("_", " ").toUpperCase()}
        </span>
      </div>

      <div className="space-y-4">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;

          return (
            <div key={step.name} className="relative">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="relative">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full ${getStepColor(
                      step
                    )}`}
                  >
                    {getStepIcon(step)}
                  </div>
                  {/* Connector line */}
                  {!isLast && (
                    <div className="absolute left-5 top-10 w-0.5 h-8 bg-gray-200 dark:bg-gray-700"></div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    {formatStepName(step.name)}
                  </h4>
                  <div className="flex items-center gap-4 mt-1">
                    <span
                      className={`text-xs ${
                        step.status === "completed"
                          ? "text-green-600 dark:text-green-400"
                          : step.status === "failed"
                          ? "text-red-600 dark:text-red-400"
                          : step.status === "in_progress"
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {step.status.replace("_", " ").toUpperCase()}
                    </span>
                    {step.completedAt && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(step.completedAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                  {step.error && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                      {step.error}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
