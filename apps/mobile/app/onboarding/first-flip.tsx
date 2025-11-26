import { SafeAreaView, ScrollView, View, Text, Pressable } from "react-native";
import { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppHeader } from "@/components/AppHeader";
import { Loading } from "@/components/Loading";

const STEPS = ["Pick niche", "Set search", "Enable push"] as const;

export default function FirstFlipOnboarding() {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);

  const complete = async () => {
    setBusy(true);
    await AsyncStorage.setItem("onboarding_complete", "true");
    setBusy(false);
  };

  if (busy) return <Loading />;

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <AppHeader title="First Flip" subtitle={`Step ${step + 1} of ${STEPS.length}`} />
        <View className="px-4 space-y-3">
          <Text className="text-lg font-semibold text-white">{STEPS[step]}</Text>
          <Text className="text-sm text-slate-300">
            Configure your first search and enable notifications to catch deals fast.
          </Text>
          <Pressable
            className="mt-4 rounded-full bg-cyan-500 px-4 py-2"
            onPress={() => setStep(Math.min(step + 1, STEPS.length - 1))}
          >
            <Text className="text-center font-semibold text-slate-900">Next</Text>
          </Pressable>
          {step === STEPS.length - 1 && (
            <Pressable className="rounded-full border border-slate-700 px-4 py-2" onPress={complete}>
              <Text className="text-center font-semibold text-slate-200">Finish</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
