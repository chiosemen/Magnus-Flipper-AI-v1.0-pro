import { SafeAreaView, ScrollView, View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useNewSearchWizard } from "@/hooks/useNewSearchWizard";
import { useTrialGate } from "@/hooks/useTrialGate";

const MANUFACTURERS = ["Apple", "Samsung", "Toyota", "Honda", "Ikea"];

export default function ManufacturerStep() {
  const { gate } = useTrialGate();
  gate(["active", "trialing"]);
  const router = useRouter();
  const { setManufacturer, state } = useNewSearchWizard();

  const handleSelect = (val: string) => {
    setManufacturer(val);
    router.push("/searches/new/models");
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text className="text-2xl font-semibold text-white">Pick a manufacturer</Text>
        <View className="space-y-2">
          {MANUFACTURERS.map((m) => (
            <Pressable
              key={m}
              onPress={() => handleSelect(m)}
              className="rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-3"
            >
              <Text className="text-white">{m}</Text>
            </Pressable>
          ))}
        </View>
        <Text className="text-xs text-slate-400">Current: {state.manufacturer ?? "None"}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
