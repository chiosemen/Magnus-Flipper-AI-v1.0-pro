import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MarketBadge } from '@/components/MarketBadge';

type Listing = {
  source: string;
  title: string;
  priceText: string;
  url: string;
  image?: string;
  badge: 'verified' | 'live-capture' | 'recent' | 'in-progress';
  freshnessSeconds: number;
};

type SearchMeta = {
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

function formatFreshness(seconds: number): string {
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

export default function ResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ items?: string; meta?: string }>();

  const items = useMemo<Listing[]>(() => {
    if (!params.items) return [];
    try {
      return JSON.parse(params.items);
    } catch {
      return [];
    }
  }, [params.items]);

  const meta = useMemo<SearchMeta | null>(() => {
    if (!params.meta) return null;
    try {
      return JSON.parse(params.meta);
    } catch {
      return null;
    }
  }, [params.meta]);

  const handleItemPress = async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      }
    } catch (err) {
      console.error('Failed to open URL:', err);
    }
  };

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No results found</Text>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Back to Search</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.heading}>Results</Text>
        {meta && (
          <View style={styles.metaBadge}>
            <Text style={styles.metaText}>
              {items.length} {items.length === 1 ? 'listing' : 'listings'}
              {meta.cached && ' · Cached'}
              {meta.ms && ` · ${meta.ms}ms`}
            </Text>
          </View>
        )}
      </View>

      {items.map((item, index) => (
        <Pressable
          key={`${item.url}-${index}`}
          style={styles.itemCard}
          onPress={() => handleItemPress(item.url)}
        >
          {item.image && (
            <Image
              source={{ uri: item.image }}
              style={styles.itemImage}
              resizeMode="cover"
            />
          )}
          <View style={styles.itemContent}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemTitle} numberOfLines={2}>
                {item.title || 'Untitled Listing'}
              </Text>
              <MarketBadge variant={item.badge} />
            </View>
            <Text style={styles.itemPrice}>{item.priceText || 'Price not available'}</Text>
            <View style={styles.itemFooter}>
              <Text style={styles.itemSource}>{item.source.toUpperCase()}</Text>
              <Text style={styles.itemFreshness}>
                {formatFreshness(item.freshnessSeconds)}
              </Text>
            </View>
          </View>
        </Pressable>
      ))}

      <Pressable
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backButtonText}>Back to Search</Text>
      </Pressable>
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
  header: {
    gap: 8,
  },
  heading: {
    color: '#f9fafb',
    fontSize: 28,
    fontWeight: '700',
  },
  metaBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#111318',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  metaText: {
    color: '#9ca3af',
    fontSize: 12,
  },
  itemCard: {
    backgroundColor: '#111318',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
    overflow: 'hidden',
    flexDirection: 'row',
  },
  itemImage: {
    width: 120,
    height: 120,
    backgroundColor: '#1f2937',
  },
  itemContent: {
    flex: 1,
    padding: 16,
    gap: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  itemTitle: {
    flex: 1,
    color: '#f9fafb',
    fontSize: 16,
    fontWeight: '600',
  },
  itemPrice: {
    color: '#34d399',
    fontSize: 18,
    fontWeight: '700',
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  itemSource: {
    color: '#6b7280',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  itemFreshness: {
    color: '#9ca3af',
    fontSize: 11,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 16,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    backgroundColor: '#111318',
  },
  backButtonText: {
    color: '#00E5FF',
    fontSize: 14,
    fontWeight: '600',
  },
});

