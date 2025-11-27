import { useState } from "react";
import { SafeAreaView, View, Text, FlatList, RefreshControl, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useListingsFeed } from "@/hooks/useListings";
import { ListingCard } from "@/components/ListingCard";
import { SkeletonCard } from "@/components/SkeletonCard";
import { useTrialGate } from "@/hooks/useTrialGate";

const CONDITIONS = ["any", "new", "used"] as const;

export default function ListingsFeedScreen() {
  const { gate } = useTrialGate();
  gate(["active", "trialing"]);
  const router = useRouter();
  const [condition, setCondition] = useState<string>("any");
  const { listings, loading, refreshing, error, hasMore, loadMore, refresh } = useListingsFeed({
    pageSize: 10,
    condition: condition === "any" ? undefined : condition,
  });

  const renderItem = ({ item }: any) => (
    <ListingCard item={item} onPress={() => router.push(`/listings/${item.id}`)} />
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <View className="flex-row items-center justify-between px-4 py-3">
        <Text className="text-xl font-semibold text-white">Listings</Text>
        <View className="flex-row gap-2">
          {CONDITIONS.map((c) => (
            <Pressable
              key={c}
              onPress={() => setCondition(c)}
              className={`rounded-full px-3 py-1 border ${
                condition === c ? "border-cyan-400 bg-cyan-500/10" : "border-slate-700"
              }`}
            >
              <Text className="text-xs text-white capitalize">{c}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {error ? <Text className="px-4 pb-2 text-sm text-red-400">{error}</Text> : null}

      {loading && listings.length === 0 ? (
        <View className="px-4">
          {[...Array(4)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={listings}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#22d3ee" />}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (hasMore && !loading) loadMore();
          }}
          ListFooterComponent={
            loading ? (
              <View className="px-4">
                <SkeletonCard />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
