import { SafeAreaView, ScrollView, View, Text, Pressable, RefreshControl, Alert } from "react-native";
import { Link, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { AppHeader } from "@/components/AppHeader";
import { SavedSearchCard } from "@/components/SavedSearchCard";
import { Loading } from "@/components/Loading";
import { ErrorMessage } from "@/components/ErrorMessage";
import { EmptyState } from "@/components/EmptyState";
import { useSavedSearches } from "@/hooks/useSavedSearches";
import { useTrialGate } from "@/hooks/useTrialGate";

export default function SearchesPage() {
  const { gate } = useTrialGate();
  gate(["active", "trialing"]);
  const router = useRouter();
  const { searches, loading, error, refresh, deleteSavedSearch } = useSavedSearches();

  if (loading && searches.length === 0) return <Loading />;
  if (error) return <ErrorMessage message="Failed to load searches." />;

  const confirmDelete = (id: string) => {
    Alert.alert("Delete search", "Are you sure you want to delete this search?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteSavedSearch(id).then(refresh) },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#22d3ee" />}
      >
        <AppHeader title="Saved Searches" />
        <View className="px-4">
          <Link href="/searches/new" asChild>
            <Pressable className="mb-4 inline-flex items-center gap-2 rounded-full bg-cyan-500 px-4 py-2">
              <Feather name="plus" size={16} color="#0f172a" />
              <Text className="font-semibold text-slate-900">Create New</Text>
            </Pressable>
          </Link>

          {searches.length === 0 ? (
            <EmptyState title="No saved searches" description="Create one to start receiving alerts." />
          ) : (
            searches.map((s) => (
              <SavedSearchCard
                key={s.id}
                name={s.name || "Search"}
                summary={[s.category, s.minPrice ? `$${s.minPrice}+` : null, s.maxPrice ? `<$${s.maxPrice}` : null]
                  .filter(Boolean)
                  .join(" • ")}
                createdAt={s.createdAt}
                onPress={() => router.push(`/searches/${s.id}`)}
                onDelete={() => confirmDelete(s.id)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
