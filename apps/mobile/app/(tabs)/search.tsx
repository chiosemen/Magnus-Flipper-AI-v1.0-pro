import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { apiRequest } from '@/lib/api';
import { useApp } from '@/context/AppContext';
import { MARKETPLACES, type MarketplaceId } from '@/lib/marketplaceRegistry';

type Marketplace = 'facebook' | 'vinted' | 'gumtree';

const SUPPORTED_MARKETPLACES: Marketplace[] = ['facebook', 'vinted', 'gumtree'];

const COUNTRIES = [
  { code: 'GB', label: 'United Kingdom' },
  { code: 'US', label: 'United States' },
  { code: 'FR', label: 'France' },
  { code: 'DE', label: 'Germany' },
];

type DemoResponse = {
  items: Array<{
    source: Marketplace;
    title: string;
    priceText: string;
    url: string;
    image?: string;
    badge: 'verified' | 'live-capture' | 'recent' | 'in-progress';
    freshnessSeconds: number;
  }>;
  meta: {
    marketplace: string;
    country: string;
    cached: boolean;
    cacheStatus: string;
    strategy?: string;
    ageSeconds?: number;
    ttlSeconds?: number;
    ms?: number;
    note?: string;
  };
};

export default function SearchScreen() {
  const router = useRouter();
  const { state, setLastQuery, setLastMarketplace, setLastCountry } = useApp();
  const [query, setQuery] = useState('');
  const [marketplace, setMarketplace] = useState<Marketplace>('gumtree');
  const [country, setCountry] = useState('GB');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) {
      Alert.alert('Error', 'Please enter a search query');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { response, json } = await apiRequest<DemoResponse>(
        `/api/demo?q=${encodeURIComponent(query.trim())}&marketplace=${marketplace}&country=${country}&mode=search`,
        { method: 'GET' },
        null,
        state.demoMode
      );

      if (!response.ok) {
        const errorMsg = (json as any)?.error || 'Search failed';
        setError(errorMsg);
        return;
      }

      // Store search state
      setLastQuery(query.trim());
      setLastMarketplace(marketplace);
      setLastCountry(country);

      // Navigate to results with data
      router.push({
        pathname: '/(tabs)/results',
        params: {
          items: JSON.stringify(json.items || []),
          meta: JSON.stringify(json.meta || {}),
        },
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Network error';
      setError(errorMsg);
      Alert.alert('Error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Market Agent Search</Text>
      <Text style={styles.subheading}>Search live marketplace listings</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Search Query</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="e.g., macbook pro, iphone 13"
          placeholderTextColor="#6b7280"
          style={styles.input}
          autoCapitalize="none"
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />

        <Text style={styles.label}>Marketplace</Text>
        <View style={styles.optionsRow}>
          {SUPPORTED_MARKETPLACES.map((mp) => (
            <Pressable
              key={mp}
              onPress={() => setMarketplace(mp)}
              style={[
                styles.optionChip,
                marketplace === mp && styles.optionChipActive,
              ]}
            >
              <Text
                style={[
                  styles.optionChipText,
                  marketplace === mp && styles.optionChipTextActive,
                ]}
              >
                {MARKETPLACES[mp as MarketplaceId]?.label || mp}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Country</Text>
        <View style={styles.optionsRow}>
          {COUNTRIES.map((c) => (
            <Pressable
              key={c.code}
              onPress={() => setCountry(c.code)}
              style={[
                styles.optionChip,
                country === c.code && styles.optionChipActive,
              ]}
            >
              <Text
                style={[
                  styles.optionChipText,
                  country === c.code && styles.optionChipTextActive,
                ]}
              >
                {c.code}
              </Text>
            </Pressable>
          ))}
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSearch}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#0b0d12" />
          ) : (
            <Text style={styles.buttonText}>Search</Text>
          )}
        </Pressable>

        {state.demoMode && (
          <Text style={styles.demoNote}>Running in demo mode</Text>
        )}
      </View>
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
  label: {
    color: '#d1d5db',
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 12,
    padding: 14,
    color: '#f9fafb',
    backgroundColor: '#0b0d12',
    fontSize: 16,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
    backgroundColor: '#0b0d12',
  },
  optionChipActive: {
    borderColor: '#00E5FF',
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
  },
  optionChipText: {
    color: '#9ca3af',
    fontSize: 13,
    fontWeight: '600',
  },
  optionChipTextActive: {
    color: '#00E5FF',
  },
  button: {
    backgroundColor: '#00E5FF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#0b0d12',
    fontSize: 16,
    fontWeight: '700',
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
  demoNote: {
    color: '#6b7280',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

