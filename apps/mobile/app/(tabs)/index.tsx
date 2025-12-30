import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { apiRequest } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
  MARKETPLACE_LIST,
  MARKETPLACES,
  type MarketplaceId,
} from '@/lib/marketplaceRegistry';

const MAX_QUERIES = 10;

type SearchPolicy = {
  tier: string;
  maxQueriesPerRun: number;
  maxConcurrency: number;
  marketsAllowed: MarketplaceId[];
  dailyCuLimit?: number;
  cuCapPerRun?: number;
};

type SearchMeta = {
  estimatedCuTotal?: number;
  radiusIgnoredMarkets?: string[];
  warnings?: string[];
};

type SearchResult = {
  market: string;
  query: string;
  count: number;
  durationMs?: number;
  items: any[];
  error?: string;
  locationUsed?: {
    text?: string | null;
    lat?: number;
    lng?: number;
  } | null;
};

type SearchResponse = {
  policy: SearchPolicy;
  requestedQueries: number;
  requestedMarkets?: number;
  executedQueries: string[];
  markets: string[];
  results: SearchResult[];
  meta?: SearchMeta;
  errors?: Array<{ marketplaceId: string; message: string }>;
};

function parseQueries(input: string) {
  const values = input
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  return Array.from(new Set(values));
}

function haversineMiles(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const r = 3958.8;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const aVal =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const cVal = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
  return r * cVal;
}

function getItemLatLng(item: any): { lat: number; lng: number } | null {
  const candidates = [
    { lat: item?.lat, lng: item?.lng },
    { lat: item?.latitude, lng: item?.longitude },
    { lat: item?.location?.lat, lng: item?.location?.lng },
    { lat: item?.location?.latitude, lng: item?.location?.longitude },
  ];
  for (const candidate of candidates) {
    if (typeof candidate.lat === 'number' && typeof candidate.lng === 'number') {
      return { lat: candidate.lat, lng: candidate.lng };
    }
  }
  return null;
}

function pickField(item: any, keys: string[]) {
  for (const key of keys) {
    const value = key.split('.').reduce((acc, part) => {
      if (!acc || typeof acc !== 'object') return undefined;
      return acc[part];
    }, item);
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number') return String(value);
  }
  return '';
}

export default function SearchScreen() {
  const { token } = useAuth();
  const [queryText, setQueryText] = useState('');
  const [locationText, setLocationText] = useState('London');
  const [units, setUnits] = useState<'mi' | 'km'>('mi');
  const [radiusValue, setRadiusValue] = useState(25);
  const [selectedMarkets, setSelectedMarkets] = useState<MarketplaceId[]>([
    'facebook',
    'vinted',
  ]);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [meta, setMeta] = useState<SearchMeta | null>(null);
  const [policy, setPolicy] = useState<SearchPolicy | null>(null);
  const [requestedMarkets, setRequestedMarkets] = useState<number | null>(null);
  const [executedMarkets, setExecutedMarkets] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [clientWarning, setClientWarning] = useState<string | null>(null);

  const parsedQueries = useMemo(() => parseQueries(queryText), [queryText]);
  const limitedQueries = parsedQueries.slice(0, MAX_QUERIES);
  const hasQueryOverflow = parsedQueries.length > MAX_QUERIES;
  const radiusKm = useMemo(() => {
    return units === 'mi' ? radiusValue * 1.60934 : radiusValue;
  }, [units, radiusValue]);

  const allowedMarkets = policy?.marketsAllowed ?? null;

  useEffect(() => {
    if (!allowedMarkets?.length) return;
    setSelectedMarkets((prev) => {
      const filtered = prev.filter((market) => allowedMarkets.includes(market));
      return filtered.length > 0 ? filtered : [allowedMarkets[0]];
    });
  }, [allowedMarkets]);

  const geoSummary = useMemo(() => {
    const marketsLabel = selectedMarkets
      .map((market) => MARKETPLACES[market]?.label ?? market)
      .join(', ');
    return `Location: ${locationText || 'n/a'} · ${radiusValue} ${units} · ${marketsLabel}`;
  }, [locationText, radiusValue, units, selectedMarkets]);

  const warnings = useMemo(() => {
    const messages: string[] = [];
    if (hasQueryOverflow) {
      messages.push(
        `${parsedQueries.length} queries entered → capped at ${MAX_QUERIES}.`
      );
    }
    if (meta?.radiusIgnoredMarkets?.length) {
      const labels = meta.radiusIgnoredMarkets
        .map((market) => MARKETPLACES[market as MarketplaceId]?.label ?? market)
        .join(', ');
      messages.push(`Radius ignored for: ${labels}.`);
    }
    if (meta?.warnings?.length) {
      meta.warnings.forEach((warning) => messages.push(warning));
    }
    if (errors.length > 0) {
      messages.push(errors.join(' '));
    }
    if (clientWarning) {
      messages.push(clientWarning);
    }
    return Array.from(new Set(messages));
  }, [errors, meta, hasQueryOverflow, parsedQueries.length, clientWarning]);

  const marketProgress = useMemo(() => {
    if (!executedMarkets?.length) return null;
    const total =
      typeof requestedMarkets === 'number' && requestedMarkets > 0
        ? requestedMarkets
        : executedMarkets.length;
    return `${executedMarkets.length} / ${total} markets completed`;
  }, [executedMarkets, requestedMarkets]);

  const handleMarketToggle = (market: MarketplaceId) => {
    if (allowedMarkets && !allowedMarkets.includes(market)) return;
    setSelectedMarkets((prev) =>
      prev.includes(market)
        ? prev.filter((value) => value !== market)
        : [...prev, market]
    );
  };

  const runSearch = async () => {
    setErrors([]);
    setClientWarning(null);
    setLoading(true);
    setResults([]);
    setMeta(null);
    setPolicy(null);
    setRequestedMarkets(null);
    setExecutedMarkets(null);

    if (!limitedQueries.length) {
      setClientWarning('Add at least one search term.');
      setLoading(false);
      return;
    }

    if (selectedMarkets.length === 0) {
      setClientWarning('Select at least one marketplace.');
      setLoading(false);
      return;
    }

    const isPostal = /\d/.test(locationText);
    const body = {
      queries: limitedQueries,
      markets: selectedMarkets,
      locationText: !isPostal ? locationText : null,
      postalCode: isPostal ? locationText : null,
      radiusKm,
      units,
    };

    try {
      const { response, json } = await apiRequest<SearchResponse>(
        '/api/search',
        {
          method: 'POST',
          body: JSON.stringify(body),
        },
        token
      );

      if (!response.ok) {
        const message = (json as any)?.error || 'Search failed.';
        setErrors([message]);
        setLoading(false);
        return;
      }

      setResults(json.results || []);
      setPolicy(json.policy || null);
      setMeta(json.meta || null);
      setRequestedMarkets(json.requestedMarkets ?? null);
      setExecutedMarkets(json.markets ?? null);

      if (json.requestedMarkets && json.markets) {
        const skipped = json.requestedMarkets - json.markets.length;
        if (skipped > 0) {
          setClientWarning(`${skipped} markets skipped (plan limit).`);
        }
      }
    } catch (err) {
      setErrors([
        err instanceof Error ? err.message : 'Network error. Try again.',
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Search live markets</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Search queries</Text>
        <TextInput
          value={queryText}
          onChangeText={setQueryText}
          placeholder="iphone 13, macbook pro, ps5"
          placeholderTextColor="#6b7280"
          style={styles.input}
        />

        <Text style={styles.label}>Location</Text>
        <TextInput
          value={locationText}
          onChangeText={setLocationText}
          placeholder="City or postal code"
          placeholderTextColor="#6b7280"
          style={styles.input}
        />

        <Text style={styles.label}>Radius</Text>
        <View style={styles.radiusRow}>
          <Text style={styles.valueText}>{`${radiusValue} ${units}`}</Text>
          <View style={styles.unitRow}>
            {(['mi', 'km'] as const).map((unit) => (
              <Pressable
                key={unit}
                onPress={() => setUnits(unit)}
                style={[
                  styles.unitButton,
                  unit === units && styles.unitButtonActive,
                ]}
              >
                <Text
                  style={
                    unit === units
                      ? styles.unitButtonTextActive
                      : styles.unitButtonText
                  }
                >
                  {unit.toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
        <Slider
          minimumValue={1}
          maximumValue={300}
          step={1}
          value={radiusValue}
          onValueChange={setRadiusValue}
          minimumTrackTintColor="#00E5FF"
          maximumTrackTintColor="#1f2937"
          thumbTintColor="#00E5FF"
        />

        <Text style={styles.label}>Markets</Text>
        <View style={styles.marketList}>
          {MARKETPLACE_LIST.map((market) => {
            const locked = allowedMarkets
              ? !allowedMarkets.includes(market.id)
              : false;
            const selected = selectedMarkets.includes(market.id);
            return (
              <Pressable
                key={market.id}
                onPress={() => handleMarketToggle(market.id)}
                style={[
                  styles.marketChip,
                  selected && styles.marketChipActive,
                  locked && styles.marketChipDisabled,
                ]}
              >
                <Text style={styles.marketChipText}>{market.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.geoSummary}>
          <Text style={styles.geoSummaryText}>{geoSummary}</Text>
        </View>

        {meta?.estimatedCuTotal ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {`Estimated cost ~${meta.estimatedCuTotal.toFixed(1)} CU`}
            </Text>
          </View>
        ) : null}

        <Pressable style={styles.primaryButton} onPress={runSearch}>
          <Text style={styles.primaryButtonText}>Run search</Text>
        </Pressable>

        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#00E5FF" />
            <View>
              <Text style={styles.loadingText}>Running pooled scan...</Text>
              <Text style={styles.loadingSubtext}>
                {`0 / ${selectedMarkets.length} markets completed`}
              </Text>
            </View>
          </View>
        )}

        {warnings.length > 0 && (
          <View style={styles.warningBox}>
            {warnings.map((warning) => (
              <Text key={warning} style={styles.warningText}>
                {warning}
              </Text>
            ))}
          </View>
        )}
      </View>

      {results.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Results</Text>
          {marketProgress && (
            <Text style={styles.metaText}>{marketProgress}</Text>
          )}
          {results.map((result, index) => {
            const marketLabel =
              MARKETPLACES[result.market as MarketplaceId]?.label ?? result.market;
            const fetchSeconds = ((result.durationMs ?? 0) / 1000).toFixed(2);
            return (
              <View key={`${result.market}-${result.query}-${index}`} style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <View style={styles.marketBadge}>
                    <Text style={styles.marketBadgeText}>{marketLabel}</Text>
                  </View>
                  <Text style={styles.resultQuery}>{result.query}</Text>
                </View>
                <Text style={styles.resultMeta}>
                  {`Fetched in ${fetchSeconds}s · ${result.count} results`}
                </Text>
                {result.error ? (
                  <Text style={styles.resultError}>{result.error}</Text>
                ) : (
                  <View style={styles.itemsGrid}>
                    {result.items.slice(0, 6).map((item, itemIndex) => {
                      const title =
                        pickField(item, [
                          'title',
                          'name',
                          'listingTitle',
                          'heading',
                          'marketplace_listing_title',
                        ]) || 'Listing';
                      const price =
                        pickField(item, [
                          'price',
                          'priceLabel',
                          'listingPrice',
                          'priceValue',
                        ]) || '—';
                      const locationLabel =
                        pickField(item, [
                          'location.city',
                          'city',
                          'location.name',
                          'location.address',
                        ]) || '—';
                      const itemLatLng = getItemLatLng(item);
                      const distance =
                        itemLatLng &&
                        result.locationUsed &&
                        typeof result.locationUsed.lat === 'number' &&
                        typeof result.locationUsed.lng === 'number'
                          ? haversineMiles(
                              {
                                lat: result.locationUsed.lat,
                                lng: result.locationUsed.lng,
                              },
                              itemLatLng
                            )
                          : null;
                      return (
                        <View key={`${result.market}-${itemIndex}`} style={styles.itemCard}>
                          <Text style={styles.itemTitle}>{title}</Text>
                          <Text style={styles.itemPrice}>{price}</Text>
                          <Text style={styles.itemLocation}>{locationLabel}</Text>
                          {distance ? (
                            <Text style={styles.itemDistance}>
                              {`~${Math.round(distance)} miles away`}
                            </Text>
                          ) : null}
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}
        </View>
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
  card: {
    backgroundColor: '#111318',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  label: {
    color: '#d1d5db',
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 12,
    padding: 12,
    color: '#f9fafb',
    backgroundColor: '#0b0d12',
  },
  radiusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  valueText: {
    color: '#f9fafb',
    fontSize: 14,
    fontWeight: '600',
  },
  unitRow: {
    flexDirection: 'row',
    gap: 8,
  },
  unitButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#374151',
  },
  unitButtonActive: {
    borderColor: '#00E5FF',
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
  },
  unitButtonText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '600',
  },
  unitButtonTextActive: {
    color: '#00E5FF',
    fontSize: 12,
    fontWeight: '700',
  },
  marketList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  marketChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#374151',
  },
  marketChipActive: {
    borderColor: '#00E5FF',
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
  },
  marketChipDisabled: {
    opacity: 0.4,
  },
  marketChipText: {
    color: '#e5e7eb',
    fontSize: 12,
  },
  geoSummary: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: '#0b0d12',
  },
  geoSummaryText: {
    color: '#9ca3af',
    fontSize: 12,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#1f2937',
    backgroundColor: '#0b0d12',
  },
  badgeText: {
    color: '#9ca3af',
    fontSize: 12,
  },
  primaryButton: {
    backgroundColor: '#00E5FF',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#0b0d12',
    fontWeight: '700',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#9ca3af',
    fontSize: 12,
  },
  loadingSubtext: {
    color: '#6b7280',
    fontSize: 11,
    marginTop: 2,
  },
  metaText: {
    color: '#9ca3af',
    fontSize: 12,
  },
  warningBox: {
    gap: 4,
  },
  warningText: {
    color: '#facc15',
    fontSize: 12,
  },
  sectionTitle: {
    color: '#f9fafb',
    fontSize: 16,
    fontWeight: '700',
  },
  resultCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
    padding: 12,
    gap: 8,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  marketBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#374151',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  marketBadgeText: {
    color: '#9ca3af',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  resultQuery: {
    color: '#f9fafb',
    fontWeight: '600',
  },
  resultMeta: {
    color: '#9ca3af',
    fontSize: 12,
  },
  resultError: {
    color: '#f87171',
    fontSize: 12,
  },
  itemsGrid: {
    gap: 10,
  },
  itemCard: {
    borderRadius: 10,
    backgroundColor: '#0b0d12',
    padding: 10,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  itemTitle: {
    color: '#f9fafb',
    fontSize: 13,
    fontWeight: '600',
  },
  itemPrice: {
    color: '#34d399',
    fontSize: 12,
    marginTop: 4,
  },
  itemLocation: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 2,
  },
  itemDistance: {
    color: '#60a5fa',
    fontSize: 11,
    marginTop: 4,
  },
});
