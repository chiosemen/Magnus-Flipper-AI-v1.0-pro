import { View, Text, Pressable } from 'react-native';
import { Link } from 'expo-router';
import type { Listing } from '@magnus-flipper-ai/core';
import { PhosphorIcon } from './PhosphorIcon';

interface Props {
  listing: Listing;
}

export function ListingCard({ listing }: Props) {
  const timeAgo = listing.postedAt
    ? Math.max(1, Math.round((Date.now() - new Date(listing.postedAt).getTime()) / 60000))
    : null;

  const siteIcon =
    listing.site === 'FB_MARKETPLACE'
      ? 'facebook-logo'
      : listing.site === 'CRAIGSLIST'
      ? 'globe-hemisphere-west'
      : listing.site === 'OFFERUP'
      ? 'tag'
      : 'radar';

  return (
    <Link href={`/listing/${listing.id}`} asChild>
      <Pressable className="rounded-xl border border-slate/50 bg-surface p-3">
        <View className="aspect-video w-full rounded-lg bg-gradient-to-br from-accent/20 to-primary/10" />
        <View className="mt-2 flex-row items-center justify-between">
          <Text className="flex-1 text-base font-semibold text-white" numberOfLines={2}>
            {listing.title}
          </Text>
          <PhosphorIcon name={siteIcon} size={18} color="#5CE0E6" />
        </View>
        <Text className="text-sm text-gray-400 capitalize">
          {listing.city || listing.region || 'Unknown'} {timeAgo ? `• ${timeAgo}m ago` : ''}
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
}
