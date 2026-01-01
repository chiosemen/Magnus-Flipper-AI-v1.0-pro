import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { MARKETPLACES, type MarketplaceId } from '@/lib/marketplaceRegistry';

type SavedSearch = {
  id: string;
  name: string;
  queries: string[];
  markets: string[];
  frequency: 'daily' | 'weekly';
  enabled: boolean;
  geo?: {
    country?: string | null;
    locationText?: string | null;
    postal?: string | null;
    radiusKm?: number | null;
    units?: 'km' | 'mi' | null;
  } | null;
  lastRun?: {
    started_at?: string | null;
    matches_found?: number;
    meta?: {
      newListings?: number | null;
      priceDrops?: number | null;
      suppressionReason?: string | null;
    };
  } | null;
};

type SavedSearchResponse = {
  savedSearches: SavedSearch[];
};

function formatRelativeTime(iso?: string | null) {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return null;
  const diffMs = Date.now() - then;
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export default function SavedSearchesScreen() {
  const { token } = useAuth();
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSearches = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const { response, json } = await apiRequest<SavedSearchResponse>(
        '/api/saved-searches',
        { method: 'GET' },
        token
      );
      if (!response.ok) {
        setError((json as any)?.error || 'Failed to load saved searches.');
        return;
      }
      setSavedSearches(json.savedSearches ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load saved searches.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadSearches();
  }, [loadSearches]);

  const toggleEnabled = async (search: SavedSearch) => {
    if (!token) return;
    try {
      const { response, json } = await apiRequest<{ savedSearch: SavedSearch }>(
        `/api/saved-searches/${search.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ enabled: !search.enabled }),
        },
        token
      );
      if (!response.ok) {
        setError((json as any)?.error || 'Failed to update search.');
        return;
      }
      setSavedSearches((prev) =>
        prev.map((item) => (item.id === search.id ? json.savedSearch : item))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update search.');
    }
  };

  const noAuth = !token;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Saved Searches</Text>
      <Text style={styles.subheading}>
        View scheduled searches and recent alert previews.
      </Text>

      {noAuth && (
        <View style={styles.card}>
          <Text style={styles.mutedText}>Log in to view saved searches.</Text>
        </View>
      )}

      {loading && (
        <View style={styles.cardRow}>
          <ActivityIndicator color="#00E5FF" />
          <Text style={styles.mutedText}>Loading saved searches...</Text>
        </View>
      )}

      {error && (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>{error}</Text>
        </View>
      )}

      {!loading && !error && token && savedSearches.length === 0 && (
        <View style={styles.card}>
          <Text style={styles.mutedText}>No saved searches yet.</Text>
        </View>
      )}

      {savedSearches.map((search) => {
        const marketsLabel = search.markets
          .map((market) => MARKETPLACES[market as MarketplaceId]?.label ?? market)
          .join(', ');
        const lastRun = search.lastRun;
        const previewCount =
          typeof lastRun?.meta?.newListings === 'number'
            ? lastRun.meta.newListings
            : lastRun?.matches_found ?? 0;
        return (
          <View key={search.id} style={styles.card}>
            <View style={styles.rowBetween}>
              <View>
                <Text style={styles.cardTitle}>{search.name}</Text>
                <Text style={styles.mutedText}>{search.queries.join(', ')}</Text>
              </View>
              <Pressable
                style={[styles.toggleButton, !search.enabled && styles.toggleButtonOff]}
                onPress={() => toggleEnabled(search)}
              >
                <Text style={styles.toggleButtonText}>
                  {search.enabled ? 'Enabled' : 'Disabled'}
                </Text>
              </Pressable>
            </View>
            <Text style={styles.metaText}>{`Markets: ${marketsLabel}`}</Text>
            <Text style={styles.metaText}>{`Cadence: ${search.frequency}`}</Text>
            {search.geo ? (
              <Text style={styles.metaText}>
                {`Geo: ${
                  [
                    search.geo.locationText,
                    search.geo.postal,
                    search.geo.country,
                    search.geo.radiusKm
                      ? `${search.geo.radiusKm} ${search.geo.units ?? 'km'}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(' · ') || 'n/a'
                }`}
              </Text>
            ) : null}
            <Text style={styles.previewText}>
              {previewCount === 0
                ? 'Preview: no new listings last run.'
                : `Preview: last run would have found ${previewCount} new listings.`}
              {typeof lastRun?.meta?.priceDrops === 'number' &&
              lastRun.meta.priceDrops > 0
                ? ` (${lastRun.meta.priceDrops} price drops)`
                : ''}
              {lastRun?.started_at
                ? ` · last checked ${formatRelativeTime(lastRun.started_at)}`
                : ''}
            </Text>
          </View>
        );
      })}
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
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  previewText: {
    color: '#facc15',
    fontSize: 12,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleButton: {
    borderWidth: 1,
    borderColor: '#00E5FF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  toggleButtonOff: {
    borderColor: '#374151',
  },
  toggleButtonText: {
    color: '#e5e7eb',
    fontSize: 12,
    fontWeight: '600',
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
});
