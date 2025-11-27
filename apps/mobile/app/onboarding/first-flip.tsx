import { SafeAreaView, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useSavedSearches } from "@/hooks/useSavedSearches";
import { useAlerts } from "@/hooks/useAlerts";
import { useListingsFeed } from "@/hooks/useListings";
import { useSubscription } from "@/hooks/useSubscription";
import { useTrialGate } from "@/hooks/useTrialGate";
import { OnboardingStepCard } from "@/components/onboarding/OnboardingStepCard";
import { FirstFlipHeader } from "@/components/onboarding/FirstFlipHeader";
import { isDemoMode } from "@/lib/config/demo-mode";
import { MOBILE_DEMO_SEARCHES, MOBILE_DEMO_ALERTS, MOBILE_DEMO_LISTINGS } from "@/lib/demo-data";

export default function FirstFlipOnboardingMobile() {
  const router = useRouter();
  const { gate } = useTrialGate();
  gate(["active", "trialing", "trial_expired", "none"]); // allow entry but gate deeper routes

  const { searches } = useSavedSearches();
  const { alerts } = useAlerts();
  const { listings } = useListingsFeed({ pageSize: 5 });
  const { subscription } = useSubscription();
  const demo = isDemoMode();

  const effectiveSearches = demo && (searches?.length ?? 0) === 0 ? MOBILE_DEMO_SEARCHES : searches || [];
  const effectiveAlerts = demo && (alerts?.length ?? 0) === 0 ? MOBILE_DEMO_ALERTS : alerts || [];
  const effectiveListings = demo && (listings?.length ?? 0) === 0 ? MOBILE_DEMO_LISTINGS : listings || [];

  const searchesCount = effectiveSearches.length;
  const alertsCount = effectiveAlerts.length;
  const hasListings = effectiveListings.length > 0;

  const step1Status = searchesCount > 0 ? "done" : "todo";
  const step2Status = searchesCount > 0 && alertsCount > 0 ? "done" : step1Status === "done" ? "in_progress" : "todo";
  const step3Status = step2Status === "done" && hasListings ? "done" : step2Status === "done" ? "in_progress" : "todo";

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <FirstFlipHeader status={subscription?.status} trialEndsAt={subscription?.trialEndsAt} />

        <View className="space-y-3">
          <OnboardingStepCard
            step={1}
            title="Set up your first search"
            description="Choose marketplace, category, and filters."
            status={step1Status as any}
            onPress={() => router.push("/searches/new/category")}
          />
          <OnboardingStepCard
            step={2}
            title="Turn on alerts"
            description="Let Magnus notify you when deals appear."
            status={step2Status as any}
            onPress={() => router.push("/alerts")}
          />
          <OnboardingStepCard
            step={3}
            title="Review your first deals"
            description="Check listings and margin."
            status={step3Status as any}
            onPress={() => router.push("/listings")}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
