import { SafeAreaView, ScrollView, View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";

const TIERS = [
  { name: "Starter", price: "$9", features: ["3 saved searches", "15 min scans"] },
  { name: "Basic", price: "$19", features: ["10 saved searches", "10 min scans"] },
  { name: "Premium", price: "$29", features: ["30 saved searches", "5 min scans"] },
  { name: "Ultra", price: "$49", features: ["100+ searches", "1-2 min scans"] },
];

export default function MobilePricingPage() {
  const router = useRouter();
  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text className="text-2xl font-semibold text-white">Pricing</Text>
        <Text className="text-sm text-slate-300">
          Choose the plan that fits your flipping pace. Upgrade or downgrade anytime.
        </Text>

        <View className="space-y-3">
          {TIERS.map((tier) => (
            <View key={tier.name} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <Text className="text-lg font-semibold text-white">{tier.name}</Text>
              <Text className="text-sm text-slate-300">{tier.price} / mo</Text>
              <View className="mt-2 space-y-1">
                {tier.features.map((f) => (
                  <Text key={f} className="text-xs text-slate-300">
                    • {f}
                  </Text>
                ))}
              </View>
            </View>
          ))}
        </View>

        <Pressable
          onPress={() => router.push("/trial")}
          className="mt-4 rounded-full border border-cyan-400 px-4 py-3"
        >
          <Text className="text-center font-semibold text-cyan-200">Start Free Trial</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
