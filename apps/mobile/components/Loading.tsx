import { View, Text } from "react-native";

export function Loading() {
  return (
    <View className="flex-1 items-center justify-center bg-slate-950">
      <Text className="text-sm text-slate-300">Loading…</Text>
    </View>
  );
}
