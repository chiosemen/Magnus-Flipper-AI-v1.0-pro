import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAlerts, useMarkAlertAsRead, useDeleteAlert } from '@/hooks/useAlerts';
import { Alert } from '@/lib/store';

export default function AlertsScreen() {
  const { data: alerts, isLoading } = useAlerts();
  const markAsReadMutation = useMarkAlertAsRead();
  const deleteMutation = useDeleteAlert();

  const handleAlertPress = (alert: Alert) => {
    if (alert.deal_id) {
      markAsReadMutation.mutate(alert.id);
      router.push(`/deal/${alert.deal_id}`);
    }
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const renderAlert = ({ item }: { item: Alert }) => (
    <TouchableOpacity
      className={`rounded-lg p-4 mb-3 ${
        item.status === 'read' ? 'bg-gray-800' : 'bg-blue-900/30 border border-blue-600'
      }`}
      onPress={() => handleAlertPress(item)}
    >
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="text-white font-semibold text-lg mb-1">
            {item.deal?.title || 'Deal Alert'}
          </Text>
          <Text className="text-gray-400">
            {item.channel === 'email' && 'Email'}
            {item.channel === 'sms' && 'SMS'}
            {item.channel === 'push' && 'Push Notification'}
          </Text>
        </View>
        <TouchableOpacity onPress={() => handleDelete(item.id)}>
          <Ionicons name="close-circle" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {item.deal && (
        <View className="flex-row justify-between items-center mt-2">
          <Text className="text-green-400 text-xl font-bold">
            ${item.deal.price.toFixed(2)}
          </Text>
          <View className="bg-blue-600 rounded-full px-3 py-1">
            <Text className="text-white font-bold">{item.deal.score}</Text>
          </View>
        </View>
      )}

      {item.sent_at && (
        <Text className="text-gray-500 text-sm mt-2">
          {new Date(item.sent_at).toLocaleDateString()}
        </Text>
      )}
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
        data={alerts}
        renderItem={renderAlert}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View className="py-20 items-center">
            <Ionicons name="notifications-off" size={64} color="#6B7280" />
            <Text className="text-gray-400 text-lg mt-4">No alerts yet</Text>
            <Text className="text-gray-500 mt-2">Create a watchlist to get alerts</Text>
          </View>
        }
      />
    </View>
  );
}
