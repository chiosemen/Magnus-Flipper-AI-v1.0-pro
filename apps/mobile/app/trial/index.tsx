import { SafeAreaView, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { AppHeader } from "@/components/AppHeader";
import { TrialCard } from "@/components/TrialCard";
import { useTrial } from "@/lib/useTrial";
import { useState } from "react";

export default function TrialPage() {
  const router = useRouter();
  const { startTrial } = useTrial();
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    try {
      setLoading(true);
      const res = await startTrial();
      if (res?.url) {
        router.push(res.url);
        return;
      }
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <AppHeader title="7-Day Trial" subtitle="Activate instant marketplace alerts" />
        <View>
          <TrialCard
            loading={loading}
            onStart={handleStart}
            onViewPlans={() => router.push("/billing")}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
