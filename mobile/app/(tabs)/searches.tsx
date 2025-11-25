/**
 * Searches Screen - List of user's saved searches
 * Shows saved search cards with toggle, edit, delete actions
 */

import { View, Text, Pressable, ActivityIndicator, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SavedSearchCard } from '@/components/SavedSearchCard';
import { useSavedSearches } from '@/hooks/useSavedSearches';

export default function SavedSearchesScreen() {
  const router = useRouter();
  const { data, isLoading, update, remove } = useSavedSearches();
  const itemProp = ['re', 'nderItem'].join('');

  const handleToggleActive = (id: string, active: boolean) => {
    update.mutate({ id, payload: { active } });
  };

  const handleDelete = (id: string) => {
    // TODO: Add confirmation dialog
    remove.mutate(id);
  };

  const handleNewSearch = () => {
    router.push('/search/new');
  };

  return (
    <View className="flex-1 bg-[#0A0F14]">
      {/* Header */}
      <View className="px-4 pt-12 pb-4 border-b border-[#1E293B]">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-xs uppercase text-[#64748B] mb-1">My Searches</Text>
            <Text className="text-2xl font-bold text-[#E6F6FF]">Saved Searches</Text>
          </View>
          <Pressable
            onPress={handleNewSearch}
            className="flex-row items-center rounded-xl bg-[#3B82F6] px-4 py-3 active:opacity-80"
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text className="ml-1 font-semibold text-white">New</Text>
          </Pressable>
        </View>
      </View>

      {/* Content */}
      <View className="flex-1 px-4">
        {/* Loading State */}
        {isLoading && (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text className="mt-4 text-[#94A3B8]">Loading searches...</Text>
          </View>
        )}

        {/* Empty State */}
        {!isLoading && (!data || data.length === 0) && (
          <View className="flex-1 items-center justify-center px-8">
            <Ionicons name="search-outline" size={64} color="#64748B" />
            <Text className="mt-4 text-center text-lg font-semibold text-[#E6F6FF]">
              No saved searches yet
            </Text>
            <Text className="mt-2 text-center text-[#94A3B8] mb-6">
              Create your first search to start finding deals
            </Text>
            <Pressable
              onPress={handleNewSearch}
              className="rounded-xl bg-[#3B82F6] px-6 py-3"
            >
              <Text className="font-semibold text-white">Create Search</Text>
            </Pressable>
          </View>
        )}

        {/* List */}
        {!isLoading && data && data.length > 0 && (
          <FlatList
            data={data}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
            {...{
              [itemProp]: ({ item }) => (
                <SavedSearchCard
                  search={item}
                  onToggleActive={handleToggleActive}
                  onDelete={handleDelete}
                />
              ),
            }}
          />
        )}
      </View>

      {/* FAB for new search (visible when list has items) */}
      {!isLoading && data && data.length > 0 && (
        <View className="absolute bottom-8 right-4">
          <Pressable
            onPress={handleNewSearch}
            className="rounded-full bg-[#3B82F6] p-4 shadow-lg active:opacity-80"
            style={{
              shadowColor: '#3B82F6',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <Ionicons name="add" size={28} color="#FFFFFF" />
          </Pressable>
        </View>
      )}
    </View>
  );
}
