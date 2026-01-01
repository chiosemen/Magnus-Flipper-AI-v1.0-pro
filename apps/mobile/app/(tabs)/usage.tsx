import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  RefreshControl,
} from 'react-native';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useApp } from '@/context/AppContext';

type UsageResponse = {
  todayCu: number;
  monthCu: number;
  byMarketplace: Array<{ marketplace: string; cu: number; label?: string }>;
  recentRuns: Array<{ market: string; cu_estimated: number; time: string }>;
  policy: {
    tier: string;
    maxQueriesPerRun: number;
    maxConcurrency: number;
    marketsAllowed: string[];
    dailyCuLimit?: number;
    cuCapPerRun?: number;
  };
  features: {
    marketAgent: {
      enabled: boolean;
      status: 'active' | 'trialing' | 'past_due' | 'unpaid' | 'canceled' | 'comped';
      graceUntil?: string | null;
      seatsPurchased?: number;
      seatsUsed?: number;
    };
  };
  limits: {
    marketAgent: {
      runsPerDay: number;
      minRefreshSeconds: number;
      maxItemsPerDay: number;
    };
  };
  usage: {
    marketAgent: {
      today: {
        runs: number;
        deploys: number;
        refreshTicks: number;
        seedIngests: number;
        itemsReturned: number;
        uniqueQueries: number;
        billableRuns: number;
      };
    };
  };
};

export default function UsageScreen() {
  const { token } = useAuth();
  const { state, setEntitlement, setUsage } = useApp();
  const [usageData, setUsageData] = useState<UsageResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadUsage = useCallback(async () => {
    if (!token) {
      setError('Please log in to view usage');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { response, json } = await apiRequest<UsageResponse>(
        '/api/usage',
        { method: 'GET' },
        token,
        false
      );

      if (!response.ok) {
        setError((json as any)?.error || 'Failed to load usage');
        return;
      }

      setUsageData(json);
      setEntitlement(json.features?.marketAgent || null);
      setUsage({
        runs: json.usage?.marketAgent?.today?.runs || 0,
        itemsReturned: json.usage?.marketAgent?.today?.itemsReturned || 0,
        runsPerDay: json.limits?.marketAgent?.runsPerDay || 250,
        itemsPerDay: json.limits?.marketAgent?.maxItemsPerDay || 20000,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load usage');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, setEntitlement, setUsage]);

  useEffect(() => {
    void loadUsage();
  }, [loadUsage]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void loadUsage();
  }, [loadUsage]);

  const runsPercent = useMemo(() => {
    if (!usageData?.limits?.marketAgent?.runsPerDay) return 0;
    const runs = usageData.usage?.marketAgent?.today?.runs || 0;
    const limit = usageData.limits.marketAgent.runsPerDay;
    return Math.min(100, (runs / limit) * 100);
  }, [usageData]);

  const itemsPercent = useMemo(() => {
    if (!usageData?.limits?.marketAgent?.maxItemsPerDay) return 0;
    const items = usageData.usage?.marketAgent?.today?.itemsReturned || 0;
    const limit = usageData.limits.marketAgent.maxItemsPerDay;
    return Math.min(100, (items / limit) * 100);
  }, [usageData]);

  if (!token) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Please log in to view usage</Text>
        </View>
      </View>
    );
  }

  if (loading && !usageData) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#00E5FF" size="large" />
          <Text style={styles.loadingText}>Loading usage...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00E5FF" />
      }
    >
      <Text style={styles.heading}>Usage</Text>
      <Text style={styles.subheading}>Daily usage and plan limits</Text>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {usageData && (
        <>
          {/* Market Agent Usage */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Market Agent Usage</Text>

            {usageData.features?.marketAgent?.status === 'past_due' &&
              usageData.features.marketAgent.graceUntil && (
                <View style={styles.graceBox}>
                  <Text style={styles.graceText}>
                    Payment pending. Active until{' '}
                    {new Date(usageData.features.marketAgent.graceUntil).toLocaleDateString()}
                  </Text>
                </View>
              )}

            {!usageData.features?.marketAgent?.enabled &&
              usageData.features?.marketAgent?.status !== 'past_due' && (
                <View style={styles.warningBox}>
                  <Text style={styles.warningText}>
                    Market Agent requires an active subscription
                  </Text>
                </View>
              )}

            <View style={styles.meter}>
              <View style={styles.meterHeader}>
                <Text style={styles.meterLabel}>Agent Runs</Text>
                <Text style={styles.meterValue}>
                  {usageData.usage.marketAgent.today.runs} /{' '}
                  {usageData.limits.marketAgent.runsPerDay}
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${runsPercent}%`,
                      backgroundColor:
                        runsPercent > 90 ? '#f87171' : runsPercent >= 70 ? '#facc15' : '#34d399',
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.meter}>
              <View style={styles.meterHeader}>
                <Text style={styles.meterLabel}>Items Returned</Text>
                <Text style={styles.meterValue}>
                  {usageData.usage.marketAgent.today.itemsReturned} /{' '}
                  {usageData.limits.marketAgent.maxItemsPerDay}
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${itemsPercent}%`,
                      backgroundColor:
                        itemsPercent > 90 ? '#f87171' : itemsPercent >= 70 ? '#facc15' : '#34d399',
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Unique Queries</Text>
                <Text style={styles.statValue}>
                  {usageData.usage.marketAgent.today.uniqueQueries}
                </Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Refresh Ticks</Text>
                <Text style={styles.statValue}>
                  {usageData.usage.marketAgent.today.refreshTicks}
                </Text>
              </View>
            </View>
          </View>

          {/* General Usage */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>General Usage</Text>
            <Text style={styles.mutedText}>Today: {usageData.todayCu.toFixed(1)} CU</Text>
            <Text style={styles.mutedText}>This month: {usageData.monthCu.toFixed(1)} CU</Text>
            <Text style={styles.mutedText}>Tier: {usageData.policy.tier}</Text>
          </View>

          {/* Top Marketplaces */}
          {usageData.byMarketplace.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Top Marketplaces (Month)</Text>
              {usageData.byMarketplace.map((market) => (
                <View key={market.marketplace} style={styles.marketRow}>
                  <Text style={styles.marketLabel}>
                    {market.label || market.marketplace}
                  </Text>
                  <Text style={styles.marketValue}>{market.cu.toFixed(1)} CU</Text>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0d12',
  },
  content: {
    padding: 20,
    gap: 16,
  },
  heading: {
    color: '#f9fafb',
    fontSize: 28,
    fontWeight: '700',
  },
  subheading: {
    color: '#9ca3af',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#111318',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  cardTitle: {
    color: '#f9fafb',
    fontSize: 18,
    fontWeight: '700',
  },
  meter: {
    gap: 8,
  },
  meterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  meterLabel: {
    color: '#d1d5db',
    fontSize: 14,
    fontWeight: '600',
  },
  meterValue: {
    color: '#f9fafb',
    fontSize: 14,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#1f2937',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  stat: {
    flex: 1,
    gap: 4,
  },
  statLabel: {
    color: '#9ca3af',
    fontSize: 12,
  },
  statValue: {
    color: '#f9fafb',
    fontSize: 20,
    fontWeight: '700',
  },
  mutedText: {
    color: '#9ca3af',
    fontSize: 14,
  },
  marketRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  marketLabel: {
    color: '#f9fafb',
    fontSize: 14,
  },
  marketValue: {
    color: '#9ca3af',
    fontSize: 14,
  },
  errorBox: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(248, 113, 113, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.4)',
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 13,
  },
  warningBox: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  warningText: {
    color: '#fbbf24',
    fontSize: 13,
  },
  graceBox: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  graceText: {
    color: '#fbbf24',
    fontSize: 13,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#9ca3af',
    fontSize: 14,
  },
});
