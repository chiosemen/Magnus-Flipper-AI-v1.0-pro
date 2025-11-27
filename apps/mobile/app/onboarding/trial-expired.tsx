import { SafeAreaView, View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";

export default function TrialExpired() {
  const router = useRouter();
  return (
    <SafeAreaView className="flex-1 bg-slate-950 items-center justify-center px-6">
      <View className="space-y-3">
        <Text className="text-3xl font-bold text-white text-center">Trial expired</Text>
        <Text className="text-sm text-slate-300 text-center">
          Upgrade to continue receiving alerts and real-time marketplace scanning.
        </Text>
        <Pressable
          onPress={() => router.push("/billing/mobile-checkout")}
          className="rounded-full bg-cyan-500 px-4 py-3"
        >
          <Text className="text-center font-semibold text-slate-900">Upgrade to Continue</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
