import { ScrollView, Text, View, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useListing } from '@/hooks/useListings';
import { Linking } from 'react-native';

export default function ListingDetail() {
  const params = useLocalSearchParams<{ id: string }>();
  const { data, isLoading } = useListing(params.id);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#5CE0E6" />
      </View>
    );
  }

  if (!data) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-gray-400">Listing not found</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background px-4 pt-12">
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} className="w-full">
        {(data.imageUrls && data.imageUrls.length ? data.imageUrls : ['placeholder']).map((_, idx) => (
          <View
            key={idx}
            className="mr-3 aspect-video w-80 rounded-2xl bg-gradient-to-br from-accent/20 to-primary/10"
          />
        ))}
      </ScrollView>
      <Text className="mt-4 text-3xl font-bold text-white">{data.title}</Text>
      <Text className="mt-1 text-gray-400">
        {data.site?.toLowerCase()} • {data.city || data.region || 'Unknown'}
      </Text>
      <Text className="mt-4 text-lg font-mono text-white">${data.price}</Text>
      <Text className="mt-2 text-gray-300">{data.description || 'No description provided.'}</Text>

      <View className="mt-6 flex-row gap-3">
        <Pressable
          className="flex-1 rounded-xl bg-primary px-4 py-3"
          onPress={() => data.url && Linking.openURL(data.url)}
        >
          <Text className="text-center font-semibold text-background">Open original</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
