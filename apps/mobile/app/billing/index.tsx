import { SafeAreaView, ScrollView, View, Text, Pressable, Linking } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { PlanSummary } from "@/components/PlanSummary";
import { Loading } from "@/components/Loading";
import { ErrorMessage } from "@/components/ErrorMessage";
import { usePlan } from "@/lib/queries/usePlan";
import { api } from "@/lib/api";

export default function BillingPage() {
  const { data, isLoading, error } = usePlan();

  if (isLoading) return <Loading />;
  if (error) return <ErrorMessage message="Failed to load billing." />;

  const handleCheckout = async () => {
    const res = await api.plan.checkout("PREMIUM");
    Linking.openURL(res.url);
  };

  const handleTrial = async () => {
    const res = await api.plan.trial();
    if (res.url) Linking.openURL(res.url);
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <AppHeader title="Billing" />
        <View className="px-4 space-y-3">
          <PlanSummary
            planName={data?.plan}
            usage={
              data?.usage ? `${data.usage.savedSearches ?? 0} / ${data.limits?.maxSavedSearches ?? "?"} searches` : undefined
            }
            trialText={data?.trial_expires_at ? `Trial ends ${data.trial_expires_at}` : undefined}
            onUpgrade={handleCheckout}
          />
          <Pressable className="rounded-full bg-cyan-500 px-4 py-2" onPress={handleCheckout}>
            <Text className="text-center font-semibold text-slate-900">Upgrade</Text>
          </Pressable>
          <Pressable className="rounded-full border border-slate-700 px-4 py-2" onPress={handleTrial}>
            <Text className="text-center font-semibold text-slate-200">Start Trial</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
