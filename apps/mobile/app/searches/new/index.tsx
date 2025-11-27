import { SafeAreaView, View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";

export default function NewSearchIndex() {
  const router = useRouter();
  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <View className="flex-1 items-center justify-center px-6 space-y-4">
        <Text className="text-2xl font-semibold text-white">Create a Saved Search</Text>
        <Text className="text-center text-sm text-slate-300">
          Start the wizard to configure category, manufacturer, models, and filters.
        </Text>
        <Pressable
          onPress={() => router.push("/searches/new/category")}
          className="rounded-full bg-cyan-500 px-4 py-2"
        >
          <Text className="text-sm font-semibold text-slate-900">Start Wizard</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
