import { SafeAreaView, View, Text, Pressable, ActivityIndicator } from "react-native";
import { Linking } from "react-native";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function MobileCheckout() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startTrial = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.subscription.startMobileTrial();
      if (res.checkoutUrl) {
        await Linking.openURL(res.checkoutUrl);
      } else {
        router.replace("/onboarding/trial-expired");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to start trial");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    startTrial();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-slate-950 items-center justify-center px-6">
      {loading ? <ActivityIndicator size="large" color="#22d3ee" /> : null}
      {error ? <Text className="mt-3 text-sm text-red-400">{error}</Text> : null}
      <Pressable onPress={startTrial} className="mt-4 rounded-full bg-cyan-500 px-4 py-3">
        <Text className="text-center font-semibold text-slate-900">Retry</Text>
      </Pressable>
    </SafeAreaView>
  );
}
