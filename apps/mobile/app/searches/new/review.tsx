import { SafeAreaView, ScrollView, View, Text, Pressable, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useNewSearchWizard } from "@/hooks/useNewSearchWizard";
import { useSavedSearches } from "@/hooks/useSavedSearches";
import { useTrialGate } from "@/hooks/useTrialGate";

export default function ReviewStep() {
  const { gate } = useTrialGate();
  gate(["active", "trialing"]);
  const router = useRouter();
  const { state, setName, reset } = useNewSearchWizard();
  const { createSavedSearch } = useSavedSearches();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!state.category) {
      setError("Category required");
      return;
    }
    setError(null);
    try {
      setLoading(true);
      await createSavedSearch({
        name: state.name || `${state.category} near me`,
        category: state.category,
        manufacturer: state.manufacturer || undefined,
        models: state.models,
        minPrice: state.minPrice,
        maxPrice: state.maxPrice,
        radiusKm: state.radiusKm,
        condition: state.condition,
      });
      reset();
      router.replace("/searches");
    } catch (err: any) {
      setError(err?.message || "Failed to create search");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text className="text-2xl font-semibold text-white">Review & Create</Text>

        <View className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
          <Text className="text-white">Category: {state.category ?? "Not set"}</Text>
          <Text className="text-white">Manufacturer: {state.manufacturer ?? "Not set"}</Text>
          <Text className="text-white">Models: {state.models.join(", ") || "None"}</Text>
          <Text className="text-white">Min Price: {state.minPrice ?? "-"}</Text>
          <Text className="text-white">Max Price: {state.maxPrice ?? "-"}</Text>
          <Text className="text-white">Radius: {state.radiusKm ?? "-"} km</Text>
          <Text className="text-white">Condition: {state.condition ?? "any"}</Text>
        </View>

        <View className="space-y-2">
          <Text className="text-sm text-slate-200">Search name</Text>
          <TextInput
            className="rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-white"
            placeholder="e.g. Phones under $500"
            placeholderTextColor="#94a3b8"
            value={state.name || ""}
            onChangeText={(v) => setName(v)}
          />
        </View>

        {error ? <Text className="text-sm text-red-400">{error}</Text> : null}

        <Pressable
          onPress={handleCreate}
          disabled={loading}
          className="mt-4 rounded-full bg-cyan-500 px-4 py-2"
        >
          <Text className="text-center font-semibold text-slate-900">{loading ? "Creating..." : "Create Search"}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
