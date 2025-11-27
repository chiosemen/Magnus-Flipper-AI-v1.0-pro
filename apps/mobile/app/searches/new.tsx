import { SafeAreaView, ScrollView, View, Text, Pressable, TextInput } from "react-native";
import { useState } from "react";
import { Feather } from "@expo/vector-icons";
import { AppHeader } from "@/components/AppHeader";
import { Loading } from "@/components/Loading";
import { ErrorMessage } from "@/components/ErrorMessage";
import { useSavedSearches } from "@/hooks/useSavedSearches";

const MARKETPLACES = ["Facebook Marketplace", "Craigslist", "Gumtree", "OfferUp"];

export default function NewSearchPage() {
  const { createSavedSearch, loading: loadingList, error } = useSavedSearches();
  const [step, setStep] = useState(0);
  const [marketplace, setMarketplace] = useState<string | null>(MARKETPLACES[0]);
  const [keywords, setKeywords] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  if (loadingList) return <Loading />;
  if (error) return <ErrorMessage message="Failed to load saved searches." />;

  const handleCreate = async () => {
    await createSavedSearch({
      name: keywords || "New search",
      category: marketplace || undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      keywords: keywords ? keywords.split(",").map((k) => k.trim()) : undefined,
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <AppHeader title="New Search" subtitle={`Step ${step + 1} of 3`} />
        <View className="px-4">
          {step === 0 && (
            <View className="space-y-3">
              <Text className="text-base font-semibold text-white">Pick marketplace</Text>
              {MARKETPLACES.map((mkt) => (
                <Pressable
                  key={mkt}
                  onPress={() => setMarketplace(mkt)}
                  className={`rounded-xl border px-4 py-3 ${
                    marketplace === mkt ? "border-cyan-400 bg-cyan-500/10" : "border-slate-800 bg-slate-900/60"
                  }`}
                >
                  <Text className="text-white">{mkt}</Text>
                </Pressable>
              ))}
            </View>
          )}

          {step === 1 && (
            <View className="space-y-3">
              <Text className="text-base font-semibold text-white">Keywords & Price</Text>
              <TextInput
                placeholder="Keywords (comma separated)"
                placeholderTextColor="#94a3b8"
                className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                value={keywords}
                onChangeText={setKeywords}
              />
              <View className="flex-row gap-3">
                <TextInput
                  placeholder="Min"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                  value={minPrice}
                  onChangeText={setMinPrice}
                />
                <TextInput
                  placeholder="Max"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                  value={maxPrice}
                  onChangeText={setMaxPrice}
                />
              </View>
            </View>
          )}

          {step === 2 && (
            <View className="space-y-2">
              <Text className="text-base font-semibold text-white">Review</Text>
              <Text className="text-slate-300">Marketplace: {marketplace}</Text>
              <Text className="text-slate-300">Keywords: {keywords || "None"}</Text>
              <Text className="text-slate-300">
                Price: {minPrice || "Any"} - {maxPrice || "Any"}
              </Text>
            </View>
          )}

          <View className="mt-6 flex-row justify-between">
            <Pressable
              className="flex-row items-center gap-2 rounded-full border border-slate-700 px-4 py-2"
              onPress={() => setStep(Math.max(0, step - 1))}
            >
              <Feather name="chevron-left" size={16} color="#e2e8f0" />
              <Text className="font-semibold text-slate-200">Back</Text>
            </Pressable>
            {step < 2 ? (
              <Pressable
                className="flex-row items-center gap-2 rounded-full bg-cyan-500 px-4 py-2"
                onPress={() => setStep(Math.min(2, step + 1))}
              >
                <Text className="font-semibold text-slate-900">Next</Text>
                <Feather name="chevron-right" size={16} color="#0f172a" />
              </Pressable>
            ) : (
              <Pressable className="rounded-full bg-cyan-500 px-4 py-2" onPress={handleCreate} disabled={create.isLoading}>
                <Text className="font-semibold text-slate-900">{create.isLoading ? "Creating..." : "Create search"}</Text>
              </Pressable>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
