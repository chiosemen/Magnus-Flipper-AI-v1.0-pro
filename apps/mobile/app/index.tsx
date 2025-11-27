import { SafeAreaView, ScrollView, View, Text, Pressable } from "react-native";
import { Link } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { AppHeader } from "@/components/AppHeader";
import { SectionTitle } from "@/components/SectionTitle";
import { PlanSummary } from "@/components/PlanSummary";
import { AlertCard } from "@/components/AlertCard";
import { ListingCard } from "@/components/ListingCard";
import { Loading } from "@/components/Loading";
import { ErrorMessage } from "@/components/ErrorMessage";
import { useAlerts } from "@/lib/queries/useAlerts";
import { useListingsFeed } from "@/lib/queries/useListings";
import { usePlan } from "@/lib/queries/usePlan";
import { isDemoMode } from "@/lib/config/demo-mode";

export default function DashboardPage() {
  const { alerts, isLoading: alertsLoading, error: alertsError } = useAlerts();
  const { feed, isLoading: listingsLoading, error: listingsError } = useListingsFeed();
  const { plan, usage } = usePlan();
  const demo = isDemoMode();

  if (alertsLoading || listingsLoading) return <Loading />;
  if (alertsError || listingsError) return <ErrorMessage message="Failed to load dashboard." />;

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {demo ? (
          <View className="mb-3 bg-amber-500/10 border border-amber-400/40 px-4 py-2">
            <Text className="text-xs font-semibold text-amber-200">
              Demo Mode: Sample data. Connect real marketplaces from the web app.
            </Text>
          </View>
        ) : null}
        <AppHeader title="Magnus Dashboard" subtitle="Stay ahead on flips" />

        <View className="px-4">
          <PlanSummary
            planName={plan}
            usage={usage ? `${usage.savedSearches ?? 0} / ${usage.maxSavedSearches || ""} searches` : undefined}
            onUpgrade={() => {}}
          />
        </View>

        <SectionTitle
          title="Recent alerts"
          action={
            <Link href="/alerts" asChild>
              <Pressable className="flex-row items-center gap-1">
                <Text className="text-sm text-cyan-300">View all</Text>
                <Feather name="chevron-right" size={16} color="#67e8f9" />
              </Pressable>
            </Link>
          }
        />
        <View className="px-4">
          {alerts.slice(0, 3).map((alert) => (
            <AlertCard key={alert.id} title={alert.title || "Match"} subtitle={alert.subtitle} timeAgo="Just now" />
          ))}
        </View>

        <SectionTitle
          title="Latest listings"
          action={
            <Link href="/searches" asChild>
              <Pressable className="flex-row items-center gap-1">
                <Text className="text-sm text-cyan-300">New search</Text>
                <Feather name="plus-circle" size={16} color="#67e8f9" />
              </Pressable>
            </Link>
          }
        />
        <View className="px-4">
          {feed.slice(0, 6).map((item) => (
            <ListingCard
              key={item.id}
              title={item.title}
              price={`$${item.price}`}
              site={item.site}
              location={item.location}
              onPress={() => {}}
            />
          ))}
        </View>

        <View className="mt-4 flex-row justify-around px-4">
          <Link href="/searches/new" asChild>
            <Pressable className="flex-row items-center gap-2 rounded-full bg-cyan-500 px-4 py-2">
              <Feather name="plus" size={16} color="#0f172a" />
              <Text className="font-semibold text-slate-900">New Search</Text>
            </Pressable>
          </Link>
          <Link href="/alerts" asChild>
            <Pressable className="flex-row items-center gap-2 rounded-full border border-slate-700 px-4 py-2">
              <Feather name="bell" size={16} color="#e2e8f0" />
              <Text className="font-semibold text-slate-200">Alerts</Text>
            </Pressable>
          </Link>
          <Link href="/billing" asChild>
            <Pressable className="flex-row items-center gap-2 rounded-full border border-slate-700 px-4 py-2">
              <Feather name="credit-card" size={16} color="#e2e8f0" />
              <Text className="font-semibold text-slate-200">Billing</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
