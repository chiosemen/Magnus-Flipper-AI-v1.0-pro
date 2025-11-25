/**
 * ListingCard - Card component for listing items in feed grid
 * Shows image, title, price, location, condition, and source badge
 */

import { View, Text, Pressable, Image } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { Listing } from '@magnus-flipper-ai/core';

interface Props {
  listing: Listing;
}

export function ListingCard({ listing }: Props) {
  // Calculate time ago in minutes/hours/days
  const getTimeAgo = () => {
    if (!listing.postedAt) return null;
    const now = Date.now();
    const posted = new Date(listing.postedAt).getTime();
    const diffMs = now - posted;
    const diffMins = Math.round(diffMs / 60000);

    if (diffMins < 60) return `${Math.max(1, diffMins)}m ago`;
    const diffHours = Math.round(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.round(diffHours / 24);
    return `${diffDays}d ago`;
  };

  // Map site to icon name
  const getSiteIcon = () => {
    switch (listing.site) {
      case 'FB_MARKETPLACE':
        return 'logo-facebook';
      case 'CRAIGSLIST':
        return 'globe-outline';
      case 'OFFERUP':
        return 'pricetag-outline';
      case 'VINTED':
        return 'shirt-outline';
      default:
        return 'radio-outline';
    }
  };

  // Get site color
  const getSiteColor = () => {
    switch (listing.site) {
      case 'FB_MARKETPLACE':
        return '#4267B2';
      case 'CRAIGSLIST':
        return '#00AB6C';
      case 'OFFERUP':
        return '#00C5CD';
      default:
        return '#3B82F6';
    }
  };

  const timeAgo = getTimeAgo();
  const hasImage = listing.imageUrls && listing.imageUrls.length > 0;

  return (
    <Link href={`/listing/${listing.id}`} asChild>
      <Pressable className="mb-2 rounded-xl border border-[#1E293B] bg-[#0F1419] overflow-hidden active:opacity-80">
        {/* Image */}
        {hasImage ? (
          <Image
            source={{ uri: listing.imageUrls[0] }}
            className="aspect-video w-full bg-[#1A1F24]"
            resizeMode="cover"
          />
        ) : (
          <View className="aspect-video w-full bg-[#1A1F24] items-center justify-center">
            <Ionicons name="image-outline" size={32} color="#64748B" />
          </View>
        )}

        {/* Source badge overlay */}
        <View className="absolute top-2 right-2 flex-row items-center rounded-full bg-black/60 px-2 py-1">
          <Ionicons name={getSiteIcon()} size={12} color={getSiteColor()} />
        </View>

        {/* Content */}
        <View className="p-3">
          {/* Title */}
          <Text className="text-base font-semibold text-[#E6F6FF] mb-1" numberOfLines={2}>
            {listing.title}
          </Text>

          {/* Location & Time */}
          <Text className="text-xs text-[#94A3B8] mb-2">
            {listing.city || listing.region || 'Unknown location'}
            {timeAgo && ` • ${timeAgo}`}
          </Text>

          {/* Price & Condition */}
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-bold text-[#E6F6FF]">
              ${listing.price.toLocaleString()}
            </Text>
            {listing.condition && (
              <View className="rounded-full bg-[#3B82F6]/20 px-2 py-1">
                <Text className="text-[10px] font-semibold text-[#3B82F6] uppercase">
                  {listing.condition.replace('_', ' ')}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    </Link>
  );
}
