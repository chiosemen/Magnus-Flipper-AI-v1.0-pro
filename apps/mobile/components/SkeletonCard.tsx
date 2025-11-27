import { View } from "react-native";

export function SkeletonCard() {
  return (
    <View className="mb-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
      <View className="h-16 w-full rounded-lg bg-slate-800" />
      <View className="mt-3 h-4 w-3/4 rounded bg-slate-800" />
      <View className="mt-2 h-3 w-1/2 rounded bg-slate-800" />
    </View>
  );
}
