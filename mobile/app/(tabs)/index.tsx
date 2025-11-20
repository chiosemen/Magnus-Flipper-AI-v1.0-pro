import { View, Text, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useDeals } from '@/hooks/useDeals';
import { Deal } from '@/lib/store';

export default function DealsScreen() {
  const { data: deals, isLoading, refetch, isRefreshing } = useDeals({ minScore: 70 });

  const renderDeal = ({ item }: { item: Deal }) => (
    <TouchableOpacity
      className="bg-gray-800 rounded-lg p-4 mb-3"
      onPress={() => router.push(`/deal/${item.id}`)}
    >
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-white font-semibold text-lg flex-1" numberOfLines={2}>
          {item.title}
        </Text>
        <View className="bg-blue-600 rounded-full px-3 py-1 ml-2">
          <Text className="text-white font-bold">{item.score}</Text>
        </View>
      </View>

      <Text className="text-gray-400 mb-2">{item.marketplace || 'Unknown'}</Text>

      <View className="flex-row justify-between items-center">
        <Text className="text-green-400 text-2xl font-bold">
          ${item.price.toFixed(2)}
        </Text>
        {item.category && (
          <Text className="text-gray-500">{item.category}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-900 justify-center items-center">
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-900">
      <FlatList
        data={deals}
        renderItem={renderDeal}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refetch} tintColor="#3B82F6" />
        }
        ListEmptyComponent={
          <View className="py-20 items-center">
            <Text className="text-gray-400 text-lg">No deals found</Text>
            <Text className="text-gray-500 mt-2">Pull to refresh</Text>
          </View>
        }
      />
    </View>
  );
}
