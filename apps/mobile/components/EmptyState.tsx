import { View, Text } from "react-native";
import { Feather } from "@expo/vector-icons";

interface EmptyStateProps {
  icon?: keyof typeof Feather.glyphMap;
  title: string;
  description?: string;
}

export function EmptyState({ icon = "inbox", title, description }: EmptyStateProps) {
  return (
    <View className="items-center justify-center rounded-2xl border border-slate-700 bg-slate-800/50 px-4 py-8">
      <Feather name={icon} size={32} color="#94a3b8" />
      <Text className="mt-3 text-base font-semibold text-white">{title}</Text>
      {description ? <Text className="mt-1 text-center text-sm text-slate-300">{description}</Text> : null}
    </View>
  );
}
