import { View, Text } from "react-native";

export function TrialBenefits() {
  const benefits = [
    "Unlimited keyword alerts",
    "Marketplace scanning",
    "AI deal detection",
    "SMS/Pushover alerts",
    "Priority crawling",
  ];

  return (
    <View className="space-y-2">
      {benefits.map((item) => (
        <View key={item} className="flex-row items-center gap-2">
          <Text className="text-cyan-300">•</Text>
          <Text className="text-slate-200">{item}</Text>
        </View>
      ))}
    </View>
  );
}
