/**
 * Optimized Feed List
 * Performance-optimized FlashList with virtualization improvements
 */

import { useMemo, useCallback, useRef, useEffect } from 'react';
import { View, Text } from 'react-native';
import { FlashList, ListRenderItem } from '@shopify/flash-list';
import type { Listing } from '@magnus-flipper-ai/core';
import { OptimizedListingCard } from './OptimizedListingCard';
import { FeedListSkeleton } from './SkeletonLoader';
import { preloadImages } from '@/lib/imageCache';

interface OptimizedFeedListProps {
  listings: Listing[];
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  isFetchingNextPage?: boolean;
  isLoading?: boolean;
  numColumns?: number;
  estimatedItemSize?: number;
}

/**
 * Optimized feed list with:
 * - Improved FlashList configuration
 * - Image preloading
 * - Optimized render callbacks
 */
export function OptimizedFeedList({
  listings,
  onEndReached,
  onEndReachedThreshold = 0.5,
  isFetchingNextPage = false,
  isLoading = false,
  numColumns = 2,
  estimatedItemSize = 280,
}: OptimizedFeedListProps) {
  const listRef = useRef<FlashList<Listing>>(null);

  // Enhanced image preloading with priority and batching
  useEffect(() => {
    if (listings.length > 0) {
      // Preload first 30 images (increased for better UX)
      const imageUrls = listings
        .slice(0, 30)
        .map((listing) => listing.imageUrls?.[0])
        .filter((url): url is string => url != null);

      if (imageUrls.length > 0) {
        // Preload with high priority for visible items
        preloadImages(imageUrls, {
          priority: 'high',
          batchSize: 8, // Larger batches for better performance
        }).catch(console.warn);
      }
    }
  }, [listings]);

  // Memoized render item
  const renderItem: ListRenderItem<Listing> = useCallback(
    ({ item }) => (
      <View className={numColumns === 2 ? 'w-1/2 p-1' : 'w-full p-2'}>
        <OptimizedListingCard listing={item} />
      </View>
    ),
    [numColumns]
  );

  // Memoized key extractor
  const keyExtractor = useCallback((item: Listing) => item.id, []);

  // Memoized footer component
  const ListFooterComponent = useMemo(
    () =>
      isFetchingNextPage ? (
        <View className="py-4">
          <Text className="text-center text-gray-400">Loading more...</Text>
        </View>
      ) : null,
    [isFetchingNextPage]
  );

  // Memoized empty component
  const ListEmptyComponent = useMemo(
    () => (
      <View className="py-8">
        <Text className="text-center text-gray-400">No listings found</Text>
      </View>
    ),
    []
  );

  // Show skeleton loader while initial loading
  if (isLoading && listings.length === 0) {
    return (
      <View className="flex-1 flex-row flex-wrap">
        <FeedListSkeleton count={numColumns === 2 ? 6 : 3} />
      </View>
    );
  }

  // Enhanced item size estimation with dynamic sizing
  const getItemType = useCallback((item: Listing, index: number) => {
    // Different item types for better layout optimization
    if (item.imageUrls && item.imageUrls.length > 0) {
      return 'with-image';
    }
    return 'text-only';
  }, []);

  // Optimized item layout calculation
  const overrideItemLayout = useCallback((layout: any, item: Listing, index: number) => {
    const itemType = getItemType(item, index);
    
    if (numColumns === 2) {
      // Two-column layout
      layout.size = itemType === 'with-image' ? estimatedItemSize : estimatedItemSize * 0.7;
    } else {
      // Single column layout
      layout.size = itemType === 'with-image' ? estimatedItemSize * 1.2 : estimatedItemSize * 0.8;
    }
  }, [numColumns, estimatedItemSize, getItemType]);

  return (
    <FlashList
      ref={listRef}
      data={listings}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      numColumns={numColumns}
      estimatedItemSize={estimatedItemSize}
      onEndReached={onEndReached}
      onEndReachedThreshold={onEndReachedThreshold}
      ListFooterComponent={ListFooterComponent}
      ListEmptyComponent={ListEmptyComponent}
      // Enhanced performance optimizations
      removeClippedSubviews={true}
      drawDistance={600} // Increased for smoother scrolling
      estimatedListSize={{
        height: listings.length * estimatedItemSize,
        width: 400,
      }}
      // Optimized item layout
      overrideItemLayout={overrideItemLayout}
      // Additional optimizations
      disableAutoLayout={false} // Let FlashList optimize layout
      type="list" // Explicit list type
      // Better memory management
      onLoadNextThreshold={0.5}
      // Optimize initial render
      initialNumToRender={numColumns === 2 ? 4 : 2}
      maxToRenderPerBatch={numColumns === 2 ? 4 : 2}
      windowSize={10} // Render 10 screens worth of items
    />
  );
}
