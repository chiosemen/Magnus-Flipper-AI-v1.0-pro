import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWatchlists, useCreateWatchlist, useDeleteWatchlist } from '@/hooks/useWatchlists';
import { Watchlist } from '@/lib/store';

export default function WatchlistsScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [keywords, setKeywords] = useState('');

  const { data: watchlists, isLoading } = useWatchlists();
  const createMutation = useCreateWatchlist();
  const deleteMutation = useDeleteWatchlist();

  const handleCreate = async () => {
    if (!name || !keywords) return;

    await createMutation.mutateAsync({
      name,
      keywords: keywords.split(',').map((k) => k.trim()),
    });

    setName('');
    setKeywords('');
    setModalVisible(false);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
  };

  const renderWatchlist = ({ item }: { item: Watchlist }) => (
    <View className="bg-gray-800 rounded-lg p-4 mb-3">
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-white font-semibold text-lg flex-1">{item.name}</Text>
        <TouchableOpacity onPress={() => handleDelete(item.id)}>
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <View className="flex-row flex-wrap gap-2 mb-2">
        {item.keywords.map((keyword, index) => (
          <View key={index} className="bg-blue-600/20 rounded-full px-3 py-1">
            <Text className="text-blue-400">{keyword}</Text>
          </View>
        ))}
      </View>

      {(item.minPrice || item.maxPrice) && (
        <Text className="text-gray-400">
          Price: ${item.minPrice || '0'} - ${item.maxPrice || '∞'}
        </Text>
      )}
    </View>
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
        data={watchlists}
        renderItem={renderWatchlist}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View className="py-20 items-center">
            <Text className="text-gray-400 text-lg">No watchlists yet</Text>
            <Text className="text-gray-500 mt-2">Create one to get started</Text>
          </View>
        }
      />

      <TouchableOpacity
        className="absolute bottom-6 right-6 bg-blue-600 w-16 h-16 rounded-full items-center justify-center"
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-gray-800 rounded-t-3xl p-6">
            <Text className="text-white text-2xl font-bold mb-4">New Watchlist</Text>

            <Text className="text-gray-400 mb-2">Name</Text>
            <TextInput
              className="bg-gray-700 text-white rounded-lg px-4 py-3 mb-4"
              placeholder="Electronics"
              placeholderTextColor="#6B7280"
              value={name}
              onChangeText={setName}
            />

            <Text className="text-gray-400 mb-2">Keywords (comma-separated)</Text>
            <TextInput
              className="bg-gray-700 text-white rounded-lg px-4 py-3 mb-6"
              placeholder="laptop, macbook, tablet"
              placeholderTextColor="#6B7280"
              value={keywords}
              onChangeText={setKeywords}
            />

            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 bg-gray-700 rounded-lg py-4"
                onPress={() => setModalVisible(false)}
              >
                <Text className="text-white text-center font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-blue-600 rounded-lg py-4"
                onPress={handleCreate}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white text-center font-semibold">Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
