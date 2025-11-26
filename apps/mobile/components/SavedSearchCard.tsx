import { View, Text, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";

interface SavedSearchCardProps {
  name: string;
  filters: string;
  onPress?: () => void;
}

export function SavedSearchCard({ name, filters, onPress }: SavedSearchCardProps) {
  return (
    <Pressable onPress={onPress} className="mb-3 rounded-xl bg-slate-800/70 p-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-semibold text-white">{name}</Text>
        <Feather name="chevron-right" size={18} color="#a5b4fc" />
      </View>
      <Text className="mt-2 text-sm text-slate-300">{filters}</Text>
    </Pressable>
  );
}
