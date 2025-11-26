import { SafeAreaView, ScrollView, View, Text, Pressable } from "react-native";
import { Link } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { AppHeader } from "@/components/AppHeader";
import { SavedSearchCard } from "@/components/SavedSearchCard";
import { Loading } from "@/components/Loading";
import { ErrorMessage } from "@/components/ErrorMessage";
import { EmptyState } from "@/components/EmptyState";
import { useSavedSearches } from "@/lib/queries/useSavedSearches";

export default function SearchesPage() {
  const { searches, isLoading, error } = useSavedSearches();

  if (isLoading) return <Loading />;
  if (error) return <ErrorMessage message="Failed to load searches." />;

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
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
                filters={[s.category, s.minPrice ? `$${s.minPrice}+` : null, s.maxPrice ? `<$${s.maxPrice}` : null]
                  .filter(Boolean)
                  .join(" • ")}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
