import { Text, View } from "react-native";

interface SectionTitleProps {
  title: string;
  action?: React.ReactNode;
}

export function SectionTitle({ title, action }: SectionTitleProps) {
  return (
    <View className="mb-2 flex-row items-center justify-between px-4">
      <Text className="text-lg font-semibold text-white">{title}</Text>
      {action}
    </View>
  );
}
