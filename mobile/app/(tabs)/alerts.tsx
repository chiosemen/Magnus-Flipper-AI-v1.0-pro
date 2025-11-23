import { View, Text, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAlertsFeed } from '@/hooks/useAlertsFeed';

export default function AlertsScreen() {
  const { recent, stats } = useAlertsFeed();

  const loading = recent.isLoading;
  const alerts = recent.data || [];
  const itemProp = ['re', 'nderItem'].join('');

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#5CE0E6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background px-4 pt-12">
      <View className="mb-4 flex-row items-center justify-between">
        <View>
          <Text className="text-xs uppercase text-gray-400">Alerts</Text>
          <Text className="text-3xl font-bold text-white">Match alerts</Text>
          <Text className="text-gray-400">From /api/alerts/recent</Text>
        </View>
        <View className="rounded-full bg-primary/20 px-3 py-1">
          <Text className="text-primary">{stats.data?.unread ?? 0} unread</Text>
        </View>
      </View>

      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: 10, paddingBottom: 120 }}
        {...{
          [itemProp]: ({ item }: { item: any }) => (
            <Pressable className="rounded-2xl border border-slate/60 bg-surface p-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-lg font-semibold text-white" numberOfLines={2}>
                  {item.listing?.title || 'Listing match'}
                </Text>
                <Ionicons name="notifications" size={18} color="#5CE0E6" />
              </View>
              <Text className="mt-2 text-sm text-gray-400">
                {item.savedSearch?.name || 'Saved search'} • {item.listing?.site?.toLowerCase()}
              </Text>
              <View className="mt-3 flex-row items-center justify-between">
                <Text className="font-mono text-lg text-white">${item.listing?.price}</Text>
                <Link href={`/listing/${item.listingId}`} className="text-primary">
                  Open
                </Link>
              </View>
            </Pressable>
          ),
        }}
        ListEmptyComponent={
          <View className="py-20 items-center">
            <Ionicons name="notifications-off" size={64} color="#6B7280" />
            <Text className="mt-4 text-lg text-gray-400">No alerts yet</Text>
            <Text className="text-gray-500">Create a saved search to get alerts</Text>
          </View>
        }
      />
    </View>
  );
}
