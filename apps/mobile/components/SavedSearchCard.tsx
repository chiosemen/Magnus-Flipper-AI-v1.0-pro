import { View, Text, Pressable } from "react-native";

type SavedSearchCardProps = {
  name: string;
  summary: string;
  createdAt?: string;
  alertsToday?: number;
  onPress?: () => void;
  onDelete?: () => void;
};

export function SavedSearchCard({ name, summary, createdAt, alertsToday, onPress, onDelete }: SavedSearchCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="mb-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-4"
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-semibold text-white">{name}</Text>
        {alertsToday !== undefined ? (
          <Text className="text-xs text-cyan-200">{alertsToday} alerts today</Text>
        ) : null}
      </View>
      <Text className="mt-1 text-sm text-slate-300" numberOfLines={2}>
        {summary || "No filters specified"}
      </Text>
      {createdAt ? <Text className="mt-1 text-xs text-slate-500">Created: {createdAt}</Text> : null}
      {onDelete ? (
        <Pressable onPress={onDelete} className="mt-2 w-full rounded-full border border-red-400 px-3 py-2">
          <Text className="text-center text-sm font-semibold text-red-300">Delete</Text>
        </Pressable>
      ) : null}
    </Pressable>
  );
}
