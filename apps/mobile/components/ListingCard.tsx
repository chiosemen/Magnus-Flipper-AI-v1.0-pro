import { View, Text, Pressable, Image } from "react-native";
import { Feather } from "@expo/vector-icons";

interface ListingCardProps {
  title: string;
  price: string;
  site?: string;
  location?: string;
  imageUrl?: string;
  onPress?: () => void;
}

export function ListingCard({ title, price, site, location, imageUrl, onPress }: ListingCardProps) {
  return (
    <Pressable onPress={onPress} className="mb-3 rounded-xl bg-slate-800/70 p-4">
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} className="mb-3 h-40 w-full rounded-lg" resizeMode="cover" />
      ) : (
        <View className="mb-3 h-40 w-full rounded-lg bg-slate-700/60" />
      )}
      <Text className="text-base font-semibold text-white">{title}</Text>
      <View className="mt-1 flex-row items-center justify-between">
        <Text className="text-lg font-bold text-cyan-300">{price}</Text>
        <View className="flex-row items-center gap-1">
          <Feather name="map-pin" size={14} color="#94a3b8" />
          <Text className="text-xs text-slate-400">{location || site || "Unknown"}</Text>
        </View>
      </View>
    </Pressable>
  );
}
