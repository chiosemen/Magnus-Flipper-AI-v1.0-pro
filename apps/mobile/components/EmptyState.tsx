import { View, Text } from "react-native";

type EmptyStateProps = {
  title: string;
  description?: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <View className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 items-center">
      <Text className="text-lg font-semibold text-white">{title}</Text>
      {description ? <Text className="mt-1 text-sm text-slate-300 text-center">{description}</Text> : null}
    </View>
  );
}
