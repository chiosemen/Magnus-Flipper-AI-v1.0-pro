"use client";

/**
 * Shipping Label Card Component
 * Displays shipping label information with download/print options
 */

import { PackageIcon, DownloadIcon, PrinterIcon, ExternalLinkIcon } from "lucide-react";
import Link from "next/link";

interface ShippingLabelCardProps {
  id: string;
  orderId: string;
  trackingNumber: string;
  carrier: string;
  service: string;
  labelUrl: string;
  trackingUrl?: string;
  shippingCost: number;
  status: string;
  estimatedDeliveryDate?: string;
  createdAt: string;
}

export function ShippingLabelCard({
  id,
  orderId,
  trackingNumber,
  carrier,
  service,
  labelUrl,
  trackingUrl,
  shippingCost,
  status,
  estimatedDeliveryDate,
  createdAt,
}: ShippingLabelCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "shipped":
      case "in_transit":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "exception":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <PackageIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
              {carrier.toUpperCase()} {service}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Order #{orderId.slice(0, 8)}
            </p>
          </div>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
            status
          )}`}
        >
          {status.replace("_", " ").toUpperCase()}
        </span>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Tracking Number
          </span>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 font-mono">
            {trackingNumber}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Shipping Cost
          </span>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            ${shippingCost.toFixed(2)}
          </span>
        </div>
        {estimatedDeliveryDate && (
          <div className="flex justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Est. Delivery
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {new Date(estimatedDeliveryDate).toLocaleDateString()}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Created
          </span>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {new Date(createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
        <a
          href={labelUrl}
          download
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <DownloadIcon className="w-4 h-4" />
          Download
        </a>
        <button
          onClick={() => window.print()}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
        >
          <PrinterIcon className="w-4 h-4" />
          Print
        </button>
        {trackingUrl && (
          <Link
            href={`/shipping/tracking/${trackingNumber}`}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
          >
            <ExternalLinkIcon className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
