import { View, Text, Pressable } from "react-native";

type Status = "todo" | "in_progress" | "done";

type Props = {
  step: number;
  title: string;
  description: string;
  status: Status;
  onPress: () => void;
};

export function OnboardingStepCard({ step, title, description, status, onPress }: Props) {
  const border =
    status === "done"
      ? "border-emerald-400"
      : status === "in_progress"
      ? "border-cyan-400"
      : "border-slate-800";

  return (
    <Pressable
      onPress={onPress}
      className={`rounded-2xl border ${border} bg-slate-900/80 p-4`}
    >
      <View className="flex-row items-center justify-between">
        <View className="h-8 w-8 items-center justify-center rounded-full bg-slate-800">
          <Text className="text-sm font-semibold text-white">{step}</Text>
        </View>
        <Text
          className={`text-xs uppercase font-semibold ${
            status === "done" ? "text-emerald-400" : status === "in_progress" ? "text-cyan-300" : "text-slate-400"
          }`}
        >
          {status === "done" ? "Done" : status === "in_progress" ? "In progress" : "Todo"}
        </Text>
      </View>
      <Text className="mt-3 text-base font-semibold text-white">{title}</Text>
      <Text className="mt-1 text-sm text-slate-300">{description}</Text>
      <Text className="mt-2 text-sm font-semibold text-cyan-200">Open</Text>
    </Pressable>
  );
}
