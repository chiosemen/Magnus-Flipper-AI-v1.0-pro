import { SafeAreaView, ScrollView, View, Text, Image, Pressable, Linking } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { AppHeader } from "@/components/AppHeader";
import { Loading } from "@/components/Loading";
import { ErrorMessage } from "@/components/ErrorMessage";
import { useListing } from "@/lib/queries/useListings";

export default function ListingDetailPage() {
  const { id } = useLocalSearchParams();
  const { listing, isLoading, error } = useListing(id as string);

  if (isLoading) return <Loading />;
  if (error || !listing) return <ErrorMessage message="Listing not found." />;

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <AppHeader title={listing.title} />
        <View className="px-4">
          {listing.image ? (
            <Image source={{ uri: listing.image }} className="mb-4 h-64 w-full rounded-xl" resizeMode="cover" />
          ) : (
            <View className="mb-4 h-64 w-full rounded-xl bg-slate-800/70" />
          )}
          <Text className="text-2xl font-bold text-white">${listing.price}</Text>
          <Text className="mt-1 text-sm text-slate-300">{listing.description || "No description"}</Text>
          <View className="mt-3 flex-row items-center gap-2">
            <Feather name="map-pin" size={16} color="#94a3b8" />
            <Text className="text-sm text-slate-400">{listing.location || listing.site}</Text>
          </View>
          {listing.url && (
            <Pressable
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-cyan-500 px-4 py-2"
              onPress={() => Linking.openURL(listing.url)}
            >
              <Text className="font-semibold text-slate-900">View on marketplace</Text>
              <Feather name="external-link" size={16} color="#0f172a" />
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
