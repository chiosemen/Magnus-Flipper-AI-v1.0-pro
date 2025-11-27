import { SafeAreaView, ScrollView, View, Text, Pressable, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useNewSearchWizard } from "@/hooks/useNewSearchWizard";
import { useTrialGate } from "@/hooks/useTrialGate";

export default function FiltersStep() {
  const { gate } = useTrialGate();
  gate(["active", "trialing"]);
  const router = useRouter();
  const { state, setFilters } = useNewSearchWizard();

  const handleChange = (field: "minPrice" | "maxPrice" | "radiusKm", value: string) => {
    const num = value ? Number(value) : undefined;
    setFilters({ [field]: num });
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text className="text-2xl font-semibold text-white">Filters</Text>

        <View className="space-y-2">
          <Text className="text-sm text-slate-200">Min Price</Text>
          <TextInput
            className="rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-white"
            keyboardType="numeric"
            placeholder="100"
            placeholderTextColor="#94a3b8"
            value={state.minPrice ? String(state.minPrice) : ""}
            onChangeText={(v) => handleChange("minPrice", v)}
          />
        </View>

        <View className="space-y-2">
          <Text className="text-sm text-slate-200">Max Price</Text>
          <TextInput
            className="rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-white"
            keyboardType="numeric"
            placeholder="500"
            placeholderTextColor="#94a3b8"
            value={state.maxPrice ? String(state.maxPrice) : ""}
            onChangeText={(v) => handleChange("maxPrice", v)}
          />
        </View>

        <View className="space-y-2">
          <Text className="text-sm text-slate-200">Radius (km)</Text>
          <TextInput
            className="rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-white"
            keyboardType="numeric"
            placeholder="25"
            placeholderTextColor="#94a3b8"
            value={state.radiusKm ? String(state.radiusKm) : ""}
            onChangeText={(v) => handleChange("radiusKm", v)}
          />
        </View>

        <View className="flex-row gap-2">
          {(["any", "new", "used"] as const).map((val) => {
            const active = state.condition === val;
            return (
              <Pressable
                key={val}
                onPress={() => setFilters({ condition: val })}
                className={`rounded-full px-3 py-2 ${
                  active ? "bg-cyan-500 text-slate-900" : "border border-slate-700 text-white"
                }`}
              >
                <Text className={active ? "font-semibold text-slate-900" : "text-white"}>{val}</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable onPress={() => router.push("/searches/new/review")} className="mt-4 rounded-full bg-cyan-500 px-4 py-2">
          <Text className="text-center font-semibold text-slate-900">Next: Review</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
