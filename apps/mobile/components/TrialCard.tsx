import { View, Text, Pressable } from "react-native";

type TrialCardProps = {
  onStart: () => void;
  onViewPlans?: () => void;
  loading?: boolean;
};

export function TrialCard({ onStart, onViewPlans, loading }: TrialCardProps) {
  return (
    <View className="rounded-2xl bg-slate-800/80 p-4">
      <Text className="text-xl font-semibold text-white">Start your 7-day trial</Text>
      <Text className="mt-1 text-sm text-slate-300">
        Unlock instant alerts, faster scans, and priority spam filtering across all marketplaces.
      </Text>
      <View className="mt-3 space-y-2">
        {["Instant alerts", "Faster scan frequency", "Spam filtering & scoring"].map((item) => (
          <View key={item} className="flex-row items-center gap-2">
            <Text className="text-cyan-300">•</Text>
            <Text className="text-slate-200">{item}</Text>
          </View>
        ))}
      </View>
      <View className="mt-4 flex-row gap-2">
        <Pressable
          onPress={onStart}
          disabled={loading}
          className="flex-1 rounded-full bg-cyan-500 px-4 py-3"
        >
          <Text className="text-center font-semibold text-slate-900">
            {loading ? "Starting..." : "Start Free Trial"}
          </Text>
        </Pressable>
        {onViewPlans ? (
          <Pressable
            onPress={onViewPlans}
            className="flex-1 rounded-full border border-slate-600 px-4 py-3"
          >
            <Text className="text-center font-semibold text-slate-100">View Plans</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
