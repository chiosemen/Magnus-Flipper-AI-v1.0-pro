import { View, Text } from "react-native";
import { Feather } from "@expo/vector-icons";

interface ErrorMessageProps {
  message?: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <View className="flex-1 items-center justify-center bg-slate-950 px-4">
      <Feather name="alert-triangle" size={28} color="#fca5a5" />
      <Text className="mt-2 text-sm text-rose-200">{message || "Something went wrong"}</Text>
    </View>
  );
}
