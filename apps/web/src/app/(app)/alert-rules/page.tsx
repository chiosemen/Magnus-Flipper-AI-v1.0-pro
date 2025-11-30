"use client";

/**
 * Alert Rules Management Page
 * Create, view, edit, and delete alert rules
 */

import { useState, useEffect } from "react";
import { Plus, Bell, Trash2, Edit, Power, PowerOff } from "lucide-react";
import { getMarketplaceColor } from "@/lib/ui/marketplace-ui";

interface AlertRule {
  id: string;
  name: string;
  description?: string;
  alert_type: string;
  marketplace?: string;
  search_query?: string;
  conditions: any;
  notification_channels: string[];
  active: boolean;
  trigger_count: number;
  last_triggered_at?: string;
  created_at: string;
}

export default function AlertRulesPage() {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    fetchAlertRules();
  }, []);

  const fetchAlertRules = async () => {
    try {
      const response = await fetch("/api/alert-rules");
      const data = await response.json();
      setRules(data);
    } catch (error) {
      console.error("Error fetching alert rules:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAlertRule = async (ruleId: string, currentlyActive: boolean) => {
    try {
      await fetch(`/api/alert-rules/${ruleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !currentlyActive }),
      });
      await fetchAlertRules();
    } catch (error) {
      console.error("Error toggling alert rule:", error);
    }
  };

  const deleteAlertRule = async (ruleId: string) => {
    if (!confirm("Are you sure you want to delete this alert rule?")) return;

    try {
      await fetch(`/api/alert-rules/${ruleId}`, { method: "DELETE" });
      await fetchAlertRules();
    } catch (error) {
      console.error("Error deleting alert rule:", error);
    }
  };

  const getAlertTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      PRICE_DROP: "Price Drop",
      KEYWORD_MATCH: "Keyword Match",
      GEO_LOCATION: "Location",
      INVENTORY_RESTOCK: "Restock",
      CUSTOM: "Custom",
    };
    return labels[type] || type;
  };

  const getAlertTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      PRICE_DROP: "bg-green-500/10 text-green-400 border-green-500/30",
      KEYWORD_MATCH: "bg-blue-500/10 text-blue-400 border-blue-500/30",
      GEO_LOCATION: "bg-purple-500/10 text-purple-400 border-purple-500/30",
      INVENTORY_RESTOCK: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
      CUSTOM: "bg-gray-500/10 text-gray-400 border-gray-500/30",
    };
    return colors[type] || colors.CUSTOM;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-400">Loading alert rules...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Alert Rules</h1>
          <p className="text-gray-400 mt-1">
            Manage your marketplace alert configurations
          </p>
        </div>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Alert
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">Total Rules</div>
          <div className="text-2xl font-bold text-white">{rules.length}</div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">Active Rules</div>
          <div className="text-2xl font-bold text-green-400">
            {rules.filter((r) => r.active).length}
          </div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">Total Triggers</div>
          <div className="text-2xl font-bold text-indigo-400">
            {rules.reduce((sum, r) => sum + r.trigger_count, 0)}
          </div>
        </div>
      </div>

      {/* Alert Rules List */}
      <div className="space-y-3">
        {rules.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 border border-gray-700 rounded-lg">
            <Bell className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No alert rules configured</p>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="mt-4 text-indigo-400 hover:text-indigo-300"
            >
              Create your first alert rule
            </button>
          </div>
        ) : (
          rules.map((rule) => (
            <div
              key={rule.id}
              className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">
                      {rule.name}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium border ${getAlertTypeColor(rule.alert_type)}`}
                    >
                      {getAlertTypeLabel(rule.alert_type)}
                    </span>
                    {rule.marketplace && (
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium border ${getMarketplaceColor(rule.marketplace)}`}
                      >
                        {rule.marketplace}
                      </span>
                    )}
                    {rule.active ? (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/30">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-500/10 text-gray-400 border border-gray-500/30">
                        Inactive
                      </span>
                    )}
                  </div>
                  {rule.description && (
                    <p className="text-gray-400 text-sm mb-2">
                      {rule.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Channels: {rule.notification_channels.join(", ")}</span>
                    <span>Triggered: {rule.trigger_count} times</span>
                    {rule.last_triggered_at && (
                      <span>
                        Last: {new Date(rule.last_triggered_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleAlertRule(rule.id, rule.active)}
                    className="p-2 hover:bg-gray-700 rounded transition-colors"
                    title={rule.active ? "Deactivate" : "Activate"}
                  >
                    {rule.active ? (
                      <Power className="w-4 h-4 text-green-400" />
                    ) : (
                      <PowerOff className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                  <button
                    className="p-2 hover:bg-gray-700 rounded transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4 text-gray-400" />
                  </button>
                  <button
                    onClick={() => deleteAlertRule(rule.id)}
                    className="p-2 hover:bg-gray-700 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
