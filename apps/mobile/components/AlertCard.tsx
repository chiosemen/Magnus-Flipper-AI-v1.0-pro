import { View, Text, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";

interface AlertCardProps {
  title: string;
  subtitle?: string;
  timeAgo?: string;
  unread?: boolean;
  onPress?: () => void;
}

export function AlertCard({ title, subtitle, timeAgo, unread, onPress }: AlertCardProps) {
  return (
    <Pressable onPress={onPress} className="mb-3 rounded-xl bg-slate-800/70 p-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-semibold text-white">{title}</Text>
        {unread && <View className="h-2 w-2 rounded-full bg-cyan-400" />}
      </View>
      {subtitle ? <Text className="mt-1 text-sm text-slate-300">{subtitle}</Text> : null}
      <View className="mt-2 flex-row items-center gap-2">
        <Feather name="clock" size={14} color="#94a3b8" />
        <Text className="text-xs text-slate-400">{timeAgo || "Just now"}</Text>
      </View>
    </Pressable>
  );
}
