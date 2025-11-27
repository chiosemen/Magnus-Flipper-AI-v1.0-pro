import { View, Text, Pressable, Image } from "react-native";
import { Listing } from "@/lib/api";

type ListingCardProps = {
  item: Listing;
  onPress?: () => void;
};

export function ListingCard({ item, onPress }: ListingCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="mb-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-4"
    >
      <View className="flex-row gap-3">
        <View className="h-16 w-16 items-center justify-center rounded-xl bg-slate-800">
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} className="h-16 w-16 rounded-xl" />
          ) : (
            <Text className="text-xs text-slate-400">Image</Text>
          )}
        </View>
        <View className="flex-1">
          <Text className="text-base font-semibold text-white" numberOfLines={2}>
            {item.title}
          </Text>
          <Text className="text-sm text-cyan-200">${item.price}</Text>
          <Text className="text-xs text-slate-400">
            {item.site || "Marketplace"} • {item.location || "Unknown"}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
