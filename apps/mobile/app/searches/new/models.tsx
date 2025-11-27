import { SafeAreaView, ScrollView, View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useNewSearchWizard } from "@/hooks/useNewSearchWizard";
import { useTrialGate } from "@/hooks/useTrialGate";

const MODELS = ["iPhone 15 Pro", "Galaxy S24", "Corolla", "Civic", "Sectional Sofa"];

export default function ModelsStep() {
  const { gate } = useTrialGate();
  gate(["active", "trialing"]);
  const router = useRouter();
  const { state, toggleModel } = useNewSearchWizard();

  const handleNext = () => {
    router.push("/searches/new/filters");
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text className="text-2xl font-semibold text-white">Select models (optional)</Text>
        <View className="space-y-2">
          {MODELS.map((model) => {
            const active = state.models.includes(model);
            return (
              <Pressable
                key={model}
                onPress={() => toggleModel(model)}
                className={`rounded-xl border px-4 py-3 ${
                  active ? "border-cyan-400 bg-cyan-500/10" : "border-slate-800 bg-slate-900/80"
                }`}
              >
                <Text className="text-white">{model}</Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable onPress={handleNext} className="mt-4 rounded-full bg-cyan-500 px-4 py-2">
          <Text className="text-center font-semibold text-slate-900">Next: Filters</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
