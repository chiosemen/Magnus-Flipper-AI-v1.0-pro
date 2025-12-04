"use client";

/**
 * Tracking Timeline Component
 * Displays shipment tracking events in a timeline
 */

import { CheckCircleIcon, ClockIcon, AlertCircleIcon, PackageIcon } from "lucide-react";

interface TrackingEvent {
  id: string;
  status: string;
  statusDetail?: string;
  location?: string;
  timestamp: string;
}

interface TrackingTimelineProps {
  events: TrackingEvent[];
  loading?: boolean;
}

export function TrackingTimeline({ events, loading = false }: TrackingTimelineProps) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string, isLatest: boolean) => {
    const iconClass = isLatest ? "w-6 h-6" : "w-5 h-5";

    switch (status) {
      case "delivered":
        return <CheckCircleIcon className={`${iconClass} text-green-600 dark:text-green-400`} />;
      case "out_for_delivery":
      case "in_transit":
        return <PackageIcon className={`${iconClass} text-blue-600 dark:text-blue-400`} />;
      case "exception":
      case "failed":
        return <AlertCircleIcon className={`${iconClass} text-red-600 dark:text-red-400`} />;
      default:
        return <ClockIcon className={`${iconClass} text-gray-600 dark:text-gray-400`} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 dark:bg-green-900";
      case "out_for_delivery":
      case "in_transit":
        return "bg-blue-100 dark:bg-blue-900";
      case "exception":
      case "failed":
        return "bg-red-100 dark:bg-red-900";
      default:
        return "bg-gray-100 dark:bg-gray-700";
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
        Tracking History
      </h3>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>

        {/* Events */}
        <div className="space-y-6">
          {events.map((event, index) => {
            const isLatest = index === 0;
            return (
              <div key={event.id} className="relative flex gap-4">
                {/* Icon */}
                <div
                  className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full ${getStatusColor(
                    event.status
                  )} ${isLatest ? "ring-4 ring-blue-100 dark:ring-blue-900" : ""}`}
                >
                  {getStatusIcon(event.status, isLatest)}
                </div>

                {/* Content */}
                <div className="flex-1 pb-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4
                        className={`font-medium ${
                          isLatest
                            ? "text-gray-900 dark:text-gray-100 text-base"
                            : "text-gray-800 dark:text-gray-200 text-sm"
                        }`}
                      >
                        {event.statusDetail ||
                          event.status.replace("_", " ").toUpperCase()}
                      </h4>
                      {event.location && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {event.location}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-4">
                      {new Date(event.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {events.length === 0 && (
          <div className="text-center py-8">
            <ClockIcon className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-gray-600 dark:text-gray-400">
              No tracking events available yet
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
