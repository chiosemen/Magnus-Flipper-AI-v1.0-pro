"use client";

import { useState, useEffect } from "react";
import { Bell, Check, ExternalLink } from "lucide-react";
import Link from "next/link";

interface Alert {
  id: string;
  title: string;
  price: number;
  marketplace: string;
  url: string;
  isRead: boolean;
  createdAt: string;
  metadata: {
    imageUrl?: string;
    description?: string;
  };
  savedSearch: {
    name: string;
  } | null;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    fetchAlerts();
  }, [filter]);

  async function fetchAlerts() {
    setLoading(true);
    try {
      const url = filter === "unread" 
        ? "/api/alerts?unreadOnly=true&limit=100" 
        : "/api/alerts?limit=100";
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts);
        setUnreadCount(data.pagination.unread);
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
      setAlerts((prev) =>
        prev.map((alert) =>
          alert.id === alertId ? { ...alert, isRead: true } : alert
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  }

  async function markAllAsRead() {
    try {
      await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_all_read" }),
      });
      setAlerts((prev) =>
        prev.map((alert) => ({ ...alert, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#00E5FF]/20 to-[#7B2FFF]/20 rounded-xl flex items-center justify-center border border-[#00E5FF]/30">
              <Bell className="w-6 h-6 text-[#00E5FF]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Notifications</h1>
              <p className="text-white/60">
                {unreadCount > 0
                  ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
                  : "All caught up!"}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === "all"
                    ? "bg-[#00E5FF] text-black"
                    : "bg-white/5 text-white/70 hover:bg-white/10"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("unread")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === "unread"
                    ? "bg-[#00E5FF] text-black"
                    : "bg-white/5 text-white/70 hover:bg-white/10"
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="ml-auto px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium text-white/70 hover:text-white transition-colors flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Mark all as read
              </button>
            )}
          </div>
        </div>

        {/* Alerts List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#00E5FF]"></div>
            <p className="text-white/50 mt-4">Loading notifications...</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="bg-[#121212] border border-white/10 rounded-xl p-12 text-center">
            <Bell className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No notifications yet
            </h3>
            <p className="text-white/50 mb-6">
              We'll notify you when listings match your searches
            </p>
            <Link
              href="/marketplaces"
              className="inline-block px-6 py-3 bg-gradient-to-r from-[#00E5FF] to-[#7B2FFF] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
            >
              Browse Marketplaces
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`bg-[#121212] border border-white/10 rounded-xl p-6 transition-all ${
                  !alert.isRead ? "border-[#00E5FF]/30 bg-[#00E5FF]/5" : ""
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Image */}
                  {alert.metadata?.imageUrl && (
                    <img
                      src={alert.metadata.imageUrl}
                      alt={alert.title}
                      className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                    />
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h3 className="text-lg font-semibold text-white">
                        {alert.title}
                      </h3>
                      <span className="text-white/50 text-sm whitespace-nowrap">
                        {formatDate(alert.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl font-bold text-[#00E5FF]">
                        ${alert.price.toFixed(2)}
                      </span>
                      <span className="px-3 py-1 bg-white/5 rounded-full text-white/60 text-sm">
                        {alert.marketplace}
                      </span>
                      {!alert.isRead && (
                        <span className="px-3 py-1 bg-[#00E5FF]/20 text-[#00E5FF] rounded-full text-sm font-medium">
                          New
                        </span>
                      )}
                    </div>

                    {alert.savedSearch && (
                      <p className="text-white/50 text-sm mb-4">
                        From search: <span className="text-white/70 font-medium">{alert.savedSearch.name}</span>
                      </p>
                    )}

                    {alert.metadata?.description && (
                      <p className="text-white/60 text-sm mb-4 line-clamp-2">
                        {alert.metadata.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4">
                      <a
                        href={alert.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#00E5FF] to-[#7B2FFF] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
                        onClick={() => !alert.isRead && markAsRead(alert.id)}
                      >
                        View Listing
                        <ExternalLink className="w-4 h-4" />
                      </a>

                      {!alert.isRead && (
                        <button
                          onClick={() => markAsRead(alert.id)}
                          className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium text-white/70 hover:text-white transition-colors flex items-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
