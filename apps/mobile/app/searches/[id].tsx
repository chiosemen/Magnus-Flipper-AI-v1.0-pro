import { SafeAreaView, ScrollView, View, Text, Pressable, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { useSavedSearches } from "@/hooks/useSavedSearches";
import { EmptyState } from "@/components/EmptyState";

export default function SavedSearchDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getSavedSearch, deleteSavedSearch, refresh } = useSavedSearches();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<any | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getSavedSearch(id);
        setSearch(res);
      } catch (err: any) {
        setError(err?.message || "Failed to load search");
      } finally {
        setLoading(false);
      }
    })();
  }, [getSavedSearch, id]);

  const handleDelete = () => {
    if (!id) return;
    Alert.alert("Delete search", "Are you sure you want to delete this search?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteSavedSearch(id);
          await refresh();
          router.replace("/searches");
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-slate-950">
        <Text className="text-slate-200">Loading...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-slate-950">
        <EmptyState title="Error" description={error} />
      </SafeAreaView>
    );
  }

  if (!search) {
    return (
      <SafeAreaView className="flex-1 bg-slate-950">
        <EmptyState title="Not found" description="Saved search not found." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text className="text-2xl font-semibold text-white">{search.name}</Text>
        <Text className="text-sm text-slate-300">
          Category: {search.category || "N/A"} • Manufacturer: {search.manufacturer || "N/A"}
        </Text>
        <Text className="text-sm text-slate-300">
          Price: {search.minPrice ? `$${search.minPrice}+` : "Any"} - {search.maxPrice ? `$${search.maxPrice}` : "Any"}
        </Text>
        <Text className="text-sm text-slate-300">Condition: {search.condition || "Any"}</Text>

        <View className="mt-4 space-y-2">
          <Pressable
            onPress={() => router.push(`/searches/edit/${search.id}`)}
            className="rounded-full bg-cyan-500 px-4 py-3"
          >
            <Text className="text-center font-semibold text-slate-900">Edit Search</Text>
          </Pressable>
          <Pressable
            onPress={handleDelete}
            className="rounded-full border border-red-400 px-4 py-3"
          >
            <Text className="text-center font-semibold text-red-300">Delete Search</Text>
          </Pressable>
          <Pressable
            onPress={() => {}}
            className="rounded-full border border-slate-700 px-4 py-3"
          >
            <Text className="text-center font-semibold text-slate-100">Run Search Now</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
