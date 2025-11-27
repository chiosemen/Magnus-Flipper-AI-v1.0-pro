import { View, Text, Pressable } from "react-native";

type LockedFeatureProps = {
  title: string;
  description?: string;
  onPressUpgrade?: () => void;
};

export function LockedFeature({ title, description, onPressUpgrade }: LockedFeatureProps) {
  return (
    <View className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4">
      <Text className="text-base font-semibold text-white">{title}</Text>
      {description ? <Text className="mt-1 text-sm text-amber-100">{description}</Text> : null}
      {onPressUpgrade ? (
        <Pressable
          onPress={onPressUpgrade}
          className="mt-3 rounded-full border border-amber-400 px-4 py-2"
        >
          <Text className="text-center text-sm font-semibold text-amber-100">Upgrade</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
