/**
 * SavedSearchCard - Card component for saved search items
 * Shows search name, summary, match count, active status
 */

import { View, Text, Pressable, Switch } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { SavedSearch } from '@magnus-flipper-ai/core';

interface Props {
  search: SavedSearch;
  onToggleActive?: (id: string, active: boolean) => void;
  onDelete?: (id: string) => void;
}

export function SavedSearchCard({ search, onToggleActive, onDelete }: Props) {
  // Build summary text
  const getSummary = () => {
    const parts: string[] = [];

    if (search.manufacturer) parts.push(search.manufacturer);
    if (search.models && search.models.length > 0) {
      if (search.models.length === 1) {
        parts.push(search.models[0]);
      } else {
        parts.push(`${search.models.length} models`);
      }
    }
    if (search.minPrice || search.maxPrice) {
      const priceRange =
        search.minPrice && search.maxPrice
          ? `$${search.minPrice}-$${search.maxPrice}`
          : search.minPrice
          ? `$${search.minPrice}+`
          : `Up to $${search.maxPrice}`;
      parts.push(priceRange);
    }
    if (search.radiusMiles) {
      parts.push(`${search.radiusMiles}mi radius`);
    }

    return parts.length > 0 ? parts.join(' • ') : 'No filters';
  };

  // Get site badges
  const getSiteBadges = () => {
    if (!search.sites || search.sites.length === 0) return 'All sites';
    return search.sites
      .map((site) => {
        switch (site) {
          case 'FB_MARKETPLACE':
            return 'FB';
          case 'CRAIGSLIST':
            return 'CL';
          case 'OFFERUP':
            return 'OU';
          case 'VINTED':
            return 'VT';
          default:
            return site;
        }
      })
      .join(', ');
  };

  return (
    <View className="mb-3 rounded-xl border border-[#1E293B] bg-[#0F1419] p-4">
      <View className="flex-row items-start justify-between mb-2">
        {/* Title & Category */}
        <View className="flex-1 mr-2">
          <Text className="text-lg font-semibold text-[#E6F6FF] mb-1" numberOfLines={1}>
            {search.name}
          </Text>
          <Text className="text-sm text-[#94A3B8] capitalize">
            {search.category}
          </Text>
        </View>

        {/* Active Toggle */}
        <Switch
          value={search.active}
          onValueChange={(value) => onToggleActive?.(search.id, value)}
          trackColor={{ false: '#1E293B', true: '#3B82F640' }}
          thumbColor={search.active ? '#3B82F6' : '#64748B'}
          ios_backgroundColor="#1E293B"
        />
      </View>

      {/* Summary */}
      <Text className="text-xs text-[#64748B] mb-2" numberOfLines={2}>
        {getSummary()}
      </Text>

      {/* Sites & Stats */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          {/* Site badges */}
          <View className="flex-row items-center rounded-full bg-[#1A1F24] px-2 py-1">
            <Ionicons name="globe-outline" size={12} color="#94A3B8" />
            <Text className="ml-1 text-[10px] text-[#94A3B8]">{getSiteBadges()}</Text>
          </View>

          {/* Active status */}
          {search.active && (
            <View className="flex-row items-center rounded-full bg-[#10B981]/20 px-2 py-1">
              <Ionicons name="checkmark-circle" size={12} color="#10B981" />
              <Text className="ml-1 text-[10px] font-semibold text-[#10B981]">Active</Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View className="flex-row items-center gap-2">
          {/* Edit button */}
          <Link href={`/search/${search.id}/edit`} asChild>
            <Pressable className="p-2">
              <Ionicons name="pencil-outline" size={18} color="#3B82F6" />
            </Pressable>
          </Link>

          {/* Delete button */}
          {onDelete && (
            <Pressable onPress={() => onDelete(search.id)} className="p-2">
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}
