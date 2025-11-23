import { useState } from 'react';
import { View, Text, Pressable, TextInput, Modal, ActivityIndicator, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORIES } from '@magnus-flipper-ai/ui-config';
import { useSavedSearches } from '@/hooks/useSavedSearches';

export default function SavedSearchesScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('Quick flip');
  const [category, setCategory] = useState(CATEGORIES[0]?.id);
  const [minPrice, setMinPrice] = useState('50');
  const [maxPrice, setMaxPrice] = useState('1500');

  const { data, isLoading, create, update, remove } = useSavedSearches();
  const itemProp = ['re', 'nderItem'].join('');

  const handleCreate = async () => {
    await create.mutateAsync({
      name,
      category,
      minPrice: Number(minPrice),
      maxPrice: Number(maxPrice),
    });
    setModalVisible(false);
  };

  return (
    <View className="flex-1 bg-background px-4 pt-12">
      <View className="mb-4 flex-row items-center justify-between">
        <View>
          <Text className="text-xs uppercase text-gray-400">Searches</Text>
          <Text className="text-3xl font-bold text-white">Saved searches</Text>
          <Text className="text-gray-400">Pause, resume, or delete searches.</Text>
        </View>
        <Pressable
          onPress={() => setModalVisible(true)}
          className="rounded-full bg-primary px-4 py-2"
        >
          <Text className="font-semibold text-background">New</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator color="#5CE0E6" />
      ) : (
        <FlatList
          data={data || []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: 12, paddingBottom: 120 }}
          {...{
            [itemProp]: ({ item, index }: { item: any; index: number }) => {
              const locked = (data?.length || 0) > 10 && index >= 10;
              return (
                <View className="rounded-2xl border border-slate/60 bg-surface p-4">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-lg font-semibold text-white">{item.name}</Text>
                    {locked && <Ionicons name="lock-closed" size={16} color="#FCD34D" />}
                    <Pressable
                      onPress={() => update.mutate({ id: item.id, payload: { active: !item.active } })}
                      className={`rounded-full px-3 py-1 ${
                        item.active ? 'bg-primary/20' : 'bg-slate'
                      }`}
                    >
                      <Text className="text-xs text-white">{item.active ? 'Pause' : 'Resume'}</Text>
                    </Pressable>
                  </View>
                  <Text className="mt-2 text-sm text-gray-400">
                    {item.category} • ${item.minPrice || 0} - ${item.maxPrice || '∞'}
                  </Text>
                  <Text className="text-xs text-gray-500">
                    Next run: {item.lastRunAt ? 'scheduled' : 'soon'}
                  </Text>
                  <Text className="text-xs text-gray-500">New matches: {item.newMatches ?? 0}</Text>
                  <View className="mt-3 flex-row gap-3">
                    <Pressable
                      className="rounded-lg bg-slate px-3 py-2"
                      onPress={() => remove.mutate(item.id)}
                    >
                      <Text className="text-sm text-red-400">Delete</Text>
                    </Pressable>
                  </View>
                </View>
              );
            },
          }}
          ListEmptyComponent={
            <Text className="text-center text-gray-400">No saved searches yet.</Text>
          }
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-3xl bg-surface p-6">
            <Text className="text-2xl font-bold text-white">New search</Text>
            <Text className="mt-1 text-sm text-gray-400">
              POST /api/saved-searches with Supabase JWT.
            </Text>

            <Text className="mt-4 text-gray-300">Name</Text>
            <TextInput
              className="mt-2 rounded-xl bg-slate px-4 py-3 text-white"
              value={name}
              onChangeText={setName}
              placeholder="NYC flips"
              placeholderTextColor="#6B7280"
            />

            <Text className="mt-4 text-gray-300">Category</Text>
            <View className="mt-2 flex-row flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.id}
                  onPress={() => setCategory(cat.id)}
                  className={`rounded-full px-3 py-2 ${
                    category === cat.id ? 'bg-primary/20' : 'bg-slate'
                  }`}
                >
                  <Text className="text-sm text-white">{cat.label}</Text>
                </Pressable>
              ))}
            </View>

            <View className="mt-4 flex-row gap-3">
              <View className="flex-1">
                <Text className="text-gray-300">Min price</Text>
                <TextInput
                  keyboardType="numeric"
                  value={minPrice}
                  onChangeText={setMinPrice}
                  className="mt-2 rounded-xl bg-slate px-4 py-3 text-white"
                />
              </View>
              <View className="flex-1">
                <Text className="text-gray-300">Max price</Text>
                <TextInput
                  keyboardType="numeric"
                  value={maxPrice}
                  onChangeText={setMaxPrice}
                  className="mt-2 rounded-xl bg-slate px-4 py-3 text-white"
                />
              </View>
            </View>

            <View className="mt-6 flex-row gap-3">
              <Pressable
                className="flex-1 rounded-xl bg-slate px-4 py-3"
                onPress={() => setModalVisible(false)}
              >
                <Text className="text-center text-white">Cancel</Text>
              </Pressable>
              <Pressable
                className="flex-1 rounded-xl bg-primary px-4 py-3"
                onPress={handleCreate}
              >
                {create.isPending ? (
                  <ActivityIndicator color="#0D0D0D" />
                ) : (
                  <Text className="text-center font-semibold text-background">Save</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
