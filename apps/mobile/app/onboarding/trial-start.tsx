import { SafeAreaView, ScrollView, View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { TrialBenefits } from "@/components/TrialBenefits";

export default function TrialStartScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <View className="space-y-3">
          <Text className="text-xs font-semibold uppercase tracking-wide text-cyan-300">Trial</Text>
          <Text className="text-3xl font-bold text-white">Start Your 7-Day Free Trial</Text>
          <Text className="text-sm text-slate-300">
            Unlock instant alerts, faster scan frequency, and priority crawling across all marketplaces.
          </Text>
        </View>

        <TrialBenefits />

        <Pressable
          onPress={() => router.push("/billing/mobile-checkout")}
          className="rounded-full bg-cyan-500 px-4 py-3"
        >
          <Text className="text-center font-semibold text-slate-900">Start Trial</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
