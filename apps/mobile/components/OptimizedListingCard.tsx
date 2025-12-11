/**
 * Optimized Listing Card
 * Performance-optimized card with image caching and memoization
 */

import { memo, useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Link } from 'expo-router';
import type { Listing } from '@magnus-flipper-ai/core';
import { PhosphorIcon } from './PhosphorIcon';
import { CachedImage } from '@/lib/imageCache';

interface Props {
  listing: Listing;
}

/**
 * Optimized listing card with image caching
 * Memoized to prevent unnecessary re-renders
 */
export const OptimizedListingCard = memo(function OptimizedListingCard({ listing }: Props) {
  const timeAgo = useMemo(() => {
    if (!listing.postedAt) return null;
    return Math.max(1, Math.round((Date.now() - new Date(listing.postedAt).getTime()) / 60000));
  }, [listing.postedAt]);

  const siteIcon = useMemo(() => {
    if (listing.site === 'FB_MARKETPLACE') return 'facebook-logo';
    if (listing.site === 'CRAIGSLIST') return 'globe-hemisphere-west';
    if (listing.site === 'OFFERUP') return 'tag';
    return 'radar';
  }, [listing.site]);

  const locationText = useMemo(() => {
    return listing.city || listing.region || 'Unknown';
  }, [listing.city, listing.region]);

  const imageUrl = useMemo(() => {
    return listing.imageUrls?.[0] || null;
  }, [listing.imageUrls]);

  return (
    <Link href={`/listing/${listing.id}`} asChild>
      <Pressable className="rounded-xl border border-slate/50 bg-surface p-3">
        <CachedImage
          uri={imageUrl}
          aspectRatio={16 / 9}
          borderRadius={8}
          priority="normal"
          className="w-full"
        />
        <View className="mt-2 flex-row items-center justify-between">
          <Text className="flex-1 text-base font-semibold text-white" numberOfLines={2}>
            {listing.title}
          </Text>
          <PhosphorIcon name={siteIcon} size={18} color="#5CE0E6" />
        </View>
        <Text className="text-sm text-gray-400 capitalize">
          {locationText} {timeAgo ? `• ${timeAgo}m ago` : ''}
        </Text>
        <View className="mt-2 flex-row items-center justify-between">
          <Text className="font-mono text-lg text-white">${listing.price}</Text>
          {listing.condition ? (
            <Text className="rounded-full bg-primary/20 px-3 py-1 text-xs uppercase text-primary">
              {listing.condition}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </Link>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memoization
  return (
    prevProps.listing.id === nextProps.listing.id &&
    prevProps.listing.title === nextProps.listing.title &&
    prevProps.listing.price === nextProps.listing.price &&
    prevProps.listing.postedAt === nextProps.listing.postedAt
  );
});
