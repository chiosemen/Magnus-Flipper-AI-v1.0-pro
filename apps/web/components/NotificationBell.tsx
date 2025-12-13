"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";

interface Alert {
  id: string;
  title: string;
  price: number;
  marketplace: string;
  url: string;
  isRead: boolean;
  createdAt: string;
  savedSearch: {
    name: string;
  } | null;
}

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch unread count on mount and poll every 30 seconds
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Fetch recent alerts when dropdown opens
  useEffect(() => {
    if (showDropdown && recentAlerts.length === 0) {
      fetchRecentAlerts();
    }
  }, [showDropdown]);

  async function fetchUnreadCount() {
    try {
      const response = await fetch("/api/alerts?unreadOnly=true&limit=1");
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.pagination.unread);
      }
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  }

  async function fetchRecentAlerts() {
    setLoading(true);
    try {
      const response = await fetch("/api/alerts?limit=5");
      if (response.ok) {
        const data = await response.json();
        setRecentAlerts(data.alerts);
      }
    } catch (error) {
      console.error("Failed to fetch alerts:", error);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(alertId: string) {
    try {
      await fetch(`/api/alerts/${alertId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      });
      // Update local state
      setRecentAlerts((prev) =>
        prev.map((alert) =>
          alert.id === alertId ? { ...alert, isRead: true } : alert
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  }

  function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-white/70 hover:text-white transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-[#00E5FF] text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />

          {/* Dropdown Content */}
          <div className="absolute right-0 mt-2 w-80 bg-[#121212] border border-white/10 rounded-lg shadow-xl z-50">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-white font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <Link
                  href="/dashboard/alerts"
                  className="text-[#00E5FF] text-sm hover:underline"
                  onClick={() => setShowDropdown(false)}
                >
                  View all
                </Link>
              )}
            </div>

            {/* Alerts List */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-white/50">Loading...</div>
              ) : recentAlerts.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 text-white/20 mx-auto mb-3" />
                  <p className="text-white/50 text-sm">No notifications yet</p>
                  <p className="text-white/30 text-xs mt-1">
                    We'll notify you when listings match your searches
                  </p>
                </div>
              ) : (
                recentAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors ${
                      !alert.isRead ? "bg-[#00E5FF]/5" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Indicator */}
                      {!alert.isRead && (
                        <div className="w-2 h-2 bg-[#00E5FF] rounded-full mt-2 flex-shrink-0" />
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-white/90 text-sm font-medium truncate">
                            {alert.title}
                          </p>
                          <span className="text-white/50 text-xs whitespace-nowrap">
                            {formatTimeAgo(alert.createdAt)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[#00E5FF] font-semibold text-sm">
                            ${alert.price.toFixed(2)}
                          </span>
                          <span className="text-white/40 text-xs">
                            {alert.marketplace}
                          </span>
                        </div>

                        {alert.savedSearch && (
                          <p className="text-white/40 text-xs mb-2">
                            From search: {alert.savedSearch.name}
                          </p>
                        )}

                        <div className="flex items-center gap-2">
                          <a
                            href={alert.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#00E5FF] text-xs hover:underline"
                            onClick={() => {
                              markAsRead(alert.id);
                              setShowDropdown(false);
                            }}
                          >
                            View listing →
                          </a>
                          {!alert.isRead && (
                            <button
                              onClick={() => markAsRead(alert.id)}
                              className="text-white/40 text-xs hover:text-white/60"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {recentAlerts.length > 0 && (
              <div className="p-3 border-t border-white/10 text-center">
                <Link
                  href="/dashboard/alerts"
                  className="text-[#00E5FF] text-sm hover:underline"
                  onClick={() => setShowDropdown(false)}
                >
                  View all notifications
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
