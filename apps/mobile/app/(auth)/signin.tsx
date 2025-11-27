import { SafeAreaView, View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";

export default function SigninScreen() {
  const router = useRouter();
  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <View className="flex-1 items-center justify-center px-6 space-y-4">
        <Text className="text-2xl font-semibold text-white">Sign in</Text>
        <Text className="text-center text-sm text-slate-300">
          Access your Magnus account to manage searches and alerts.
        </Text>
        <Pressable
          onPress={() => router.push("/trial")}
          className="mt-4 rounded-full border border-cyan-400 px-4 py-2"
        >
          <Text className="text-sm font-semibold text-cyan-200">Start Free Trial</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
