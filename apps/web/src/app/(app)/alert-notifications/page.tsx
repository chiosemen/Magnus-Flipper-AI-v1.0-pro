"use client";

/**
 * Alert Notifications Dashboard
 * View and manage triggered alert notifications
 */

import { useState, useEffect } from "react";
import { Bell, BellOff, ExternalLink, X } from "lucide-react";
import { getMarketplaceColor } from "@/lib/ui/marketplace-ui";

interface AlertNotification {
  id: string;
  alert_rule_id: string;
  trigger_type: string;
  trigger_reason?: string;
  listing_title?: string;
  listing_price?: number;
  listing_url?: string;
  listing_location?: string;
  marketplace?: string;
  status: string;
  created_at: string;
  sent_at?: string;
}

export default function AlertNotificationsPage() {
  const [notifications, setNotifications] = useState<AlertNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== "all") {
        params.append("status", filter.toUpperCase());
      }

      const response = await fetch(`/api/alert-notifications?${params}`);
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const dismissNotification = async (notificationId: string) => {
    try {
      await fetch(`/api/alert-notifications/${notificationId}/dismiss`, {
        method: "POST",
      });
      await fetchNotifications();
    } catch (error) {
      console.error("Error dismissing notification:", error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
      SENT: "bg-green-500/10 text-green-400 border-green-500/30",
      FAILED: "bg-red-500/10 text-red-400 border-red-500/30",
      DISMISSED: "bg-gray-500/10 text-gray-400 border-gray-500/30",
    };
    return colors[status] || colors.PENDING;
  };

  const pendingCount = notifications.filter((n) => n.status === "PENDING").length;
  const sentCount = notifications.filter((n) => n.status === "SENT").length;
  const failedCount = notifications.filter((n) => n.status === "FAILED").length;

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-400">Loading notifications...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Alert Notifications</h1>
        <p className="text-gray-400 mt-1">
          View and manage your triggered alert notifications
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">Total</div>
          <div className="text-2xl font-bold text-white">
            {notifications.length}
          </div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">Pending</div>
          <div className="text-2xl font-bold text-yellow-400">
            {pendingCount}
          </div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">Sent</div>
          <div className="text-2xl font-bold text-green-400">{sentCount}</div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">Failed</div>
          <div className="text-2xl font-bold text-red-400">{failedCount}</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {["all", "pending", "sent", "failed", "dismissed"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === status
                ? "bg-indigo-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 border border-gray-700 rounded-lg">
            <BellOff className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No notifications found</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Bell className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-lg font-semibold text-white">
                      {notification.listing_title || "Alert Triggered"}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(notification.status)}`}
                    >
                      {notification.status}
                    </span>
                    {notification.marketplace && (
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium border ${getMarketplaceColor(notification.marketplace)}`}
                      >
                        {notification.marketplace}
                      </span>
                    )}
                  </div>

                  {notification.trigger_reason && (
                    <p className="text-gray-400 text-sm mb-2">
                      {notification.trigger_reason}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    {notification.listing_price && (
                      <span>Price: £{notification.listing_price}</span>
                    )}
                    {notification.listing_location && (
                      <span>Location: {notification.listing_location}</span>
                    )}
                    <span>
                      {new Date(notification.created_at).toLocaleString()}
                    </span>
                  </div>

                  {notification.listing_url && (
                    <a
                      href={notification.listing_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-indigo-400 hover:text-indigo-300 text-sm"
                    >
                      View Listing <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                {notification.status !== "DISMISSED" && (
                  <button
                    onClick={() => dismissNotification(notification.id)}
                    className="p-2 hover:bg-gray-700 rounded transition-colors"
                    title="Dismiss"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
