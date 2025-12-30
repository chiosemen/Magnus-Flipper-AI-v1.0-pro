import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth';

type UsageResponse = {
  todayCu: number;
  monthCu: number;
  byMarketplace: Array<{ marketplace: string; cu: number; label?: string }>;
  policy: {
    tier: string;
    maxQueriesPerRun: number;
    maxConcurrency: number;
    marketsAllowed: string[];
    dailyCuLimit?: number;
    cuCapPerRun?: number;
  };
};

export default function UsageScreen() {
  const { token } = useAuth();
  const [usage, setUsage] = useState<UsageResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUsage = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const { response, json } = await apiRequest<UsageResponse>(
        '/api/usage',
        { method: 'GET' },
        token
      );
      if (!response.ok) {
        setError((json as any)?.error || 'Failed to load usage.');
        return;
      }
      setUsage(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load usage.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadUsage();
  }, [loadUsage]);

  const dailyLimit = usage?.policy?.dailyCuLimit ?? 0;
  const percentUsed = useMemo(() => {
    if (!usage || dailyLimit <= 0) return 0;
    return Math.min(100, (usage.todayCu / dailyLimit) * 100);
  }, [usage, dailyLimit]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Usage</Text>
      <Text style={styles.subheading}>Daily usage and plan limits.</Text>

      {!token && (
        <View style={styles.card}>
          <Text style={styles.mutedText}>Log in to view usage.</Text>
        </View>
      )}

      {loading && (
        <View style={styles.cardRow}>
          <ActivityIndicator color="#00E5FF" />
          <Text style={styles.mutedText}>Loading usage...</Text>
        </View>
      )}

      {error && (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>{error}</Text>
        </View>
      )}

      {usage && (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Daily usage</Text>
            <Text style={styles.mutedText}>{`Today: ${usage.todayCu.toFixed(1)} CU`}</Text>
            <Text style={styles.mutedText}>{`Daily limit: ${dailyLimit || 'n/a'} CU`}</Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${percentUsed}%`,
                    backgroundColor:
                      percentUsed > 90
                        ? '#f87171'
                        : percentUsed >= 70
                        ? '#facc15'
                        : '#34d399',
                  },
                ]}
              />
            </View>
            <Text style={styles.metaText}>{`${percentUsed.toFixed(1)}% of daily usage`}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Month to date</Text>
            <Text style={styles.mutedText}>{`Month CU: ${usage.monthCu.toFixed(1)}`}</Text>
            <Text style={styles.metaText}>{`Tier: ${usage.policy.tier}`}</Text>
            <Text style={styles.metaText}>{`Max queries per run: ${usage.policy.maxQueriesPerRun}`}</Text>
            <Text style={styles.metaText}>{`Max concurrency: ${usage.policy.maxConcurrency}`}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Top marketplaces</Text>
            {usage.byMarketplace.length === 0 && (
              <Text style={styles.mutedText}>No usage yet.</Text>
            )}
            {usage.byMarketplace.map((market) => (
              <View key={market.marketplace} style={styles.rowBetween}>
                <Text style={styles.metaText}>{market.label ?? market.marketplace}</Text>
                <Text style={styles.metaText}>{`${market.cu.toFixed(1)} CU`}</Text>
              </View>
            ))}
            <Text style={styles.mutedHint}>Costs are estimated CUs, not billing currency.</Text>
          </View>
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
    fontSize: 22,
    fontWeight: '700',
  },
  subheading: {
    color: '#9ca3af',
    fontSize: 13,
  },
  card: {
    backgroundColor: '#111318',
    borderRadius: 16,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  cardTitle: {
    color: '#f9fafb',
    fontSize: 16,
    fontWeight: '700',
  },
  mutedText: {
    color: '#9ca3af',
    fontSize: 12,
  },
  metaText: {
    color: '#cbd5f5',
    fontSize: 12,
  },
  mutedHint: {
    color: '#6b7280',
    fontSize: 11,
    marginTop: 8,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  warningBox: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(248, 113, 113, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.4)',
  },
  warningText: {
    color: '#fca5a5',
    fontSize: 12,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#1f2937',
    overflow: 'hidden',
    marginTop: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
});
