import { SafeAreaView, ScrollView, View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useNewSearchWizard } from "@/hooks/useNewSearchWizard";
import { useTrialGate } from "@/hooks/useTrialGate";

const CATEGORIES = ["Phones", "Cars", "Couches", "Electronics"];

export default function CategoryStep() {
  const { gate } = useTrialGate();
  gate(["active", "trialing"]);
  const router = useRouter();
  const { setCategory, state } = useNewSearchWizard();

  const handleSelect = (cat: string) => {
    setCategory(cat);
    router.push("/searches/new/manufacturer");
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text className="text-2xl font-semibold text-white">Pick a category</Text>
        <View className="space-y-2">
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => handleSelect(cat)}
              className="rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-3"
            >
              <Text className="text-white">{cat}</Text>
            </Pressable>
          ))}
        </View>
        <Text className="text-xs text-slate-400">Current: {state.category ?? "None"}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
