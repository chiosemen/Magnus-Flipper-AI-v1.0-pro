import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
}

export function AppHeader({ title, subtitle }: AppHeaderProps) {
  return (
    <SafeAreaView>
      <View className="px-4 pb-3">
        <Text className="text-2xl font-bold text-white">{title}</Text>
        {subtitle ? <Text className="text-sm text-slate-300">{subtitle}</Text> : null}
      </View>
    </SafeAreaView>
  );
}
