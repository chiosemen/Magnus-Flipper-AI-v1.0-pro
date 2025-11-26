import { View, Text, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";

interface PlanSummaryProps {
  planName?: string;
  usage?: string;
  trialText?: string;
  onUpgrade?: () => void;
}

export function PlanSummary({ planName = "Starter", usage, trialText, onUpgrade }: PlanSummaryProps) {
  return (
    <View className="rounded-2xl bg-slate-800/70 p-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-lg font-semibold text-white">Current plan</Text>
        <View className="rounded-full bg-cyan-500/20 px-3 py-1">
          <Text className="text-xs font-semibold uppercase text-cyan-200">{planName}</Text>
        </View>
      </View>
      {usage ? <Text className="mt-2 text-sm text-slate-300">{usage}</Text> : null}
      {trialText ? <Text className="mt-1 text-xs text-amber-200">{trialText}</Text> : null}
      <Pressable onPress={onUpgrade} className="mt-3 inline-flex items-center gap-2 rounded-full bg-cyan-500 px-4 py-2">
        <Feather name="arrow-up-circle" size={16} color="#0f172a" />
        <Text className="text-sm font-semibold text-slate-900">Upgrade</Text>
      </Pressable>
    </View>
  );
}
