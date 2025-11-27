import { SafeAreaView, ScrollView, View, Text, Pressable, Linking } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useListing } from "@/hooks/useListings";
import { useNewSearchWizard } from "@/hooks/useNewSearchWizard";

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { listing, loading, error } = useListing(id);
  const { setCategory, setManufacturer, setFilters, setName } = useNewSearchWizard();
  const router = useRouter();

  const handleSaveSearch = () => {
    if (listing) {
      // Placeholder mapping; adjust when real fields available.
      setCategory(listing.site || null);
      setManufacturer(null);
      setFilters({
        minPrice: listing.price ? Math.max(0, listing.price - 100) : undefined,
        maxPrice: listing.price ? listing.price + 100 : undefined,
      });
      setName(listing.title);
      router.push("/searches/new/review");
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-slate-950">
        <Text className="text-slate-200">Loading...</Text>
      </SafeAreaView>
    );
  }

  if (error || !listing) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-slate-950">
        <Text className="text-red-400">{error || "Listing not found"}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <View className="h-48 w-full items-center justify-center rounded-2xl bg-slate-900">
          <Text className="text-slate-400">Image</Text>
        </View>
        <Text className="text-2xl font-semibold text-white">{listing.title}</Text>
        <Text className="text-lg text-cyan-200">${listing.price}</Text>
        <Text className="text-sm text-slate-300">
          {listing.site || "Marketplace"} • {listing.condition || "Unknown"} • {listing.location || "Unknown"}
        </Text>
        <Text className="text-sm text-slate-300">Posted: {listing.postedAt || "Unknown"}</Text>
        <Text className="text-sm text-slate-200">{listing.description || "No description provided."}</Text>

        <Pressable
          onPress={() => listing.url && Linking.openURL(listing.url)}
          className="mt-3 rounded-full bg-cyan-500 px-4 py-3"
        >
          <Text className="text-center font-semibold text-slate-900">View on website</Text>
        </Pressable>

        <Pressable
          onPress={handleSaveSearch}
          className="rounded-full border border-cyan-400 px-4 py-3"
        >
          <Text className="text-center font-semibold text-cyan-200">Save Search with this item's filters</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
