import { SafeAreaView, ScrollView, View, Text, Pressable } from "react-native";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { AlertCard } from "@/components/AlertCard";
import { Loading } from "@/components/Loading";
import { ErrorMessage } from "@/components/ErrorMessage";
import { useAlerts } from "@/lib/queries/useAlerts";

export default function AlertsPage() {
  const { alerts, isLoading, error } = useAlerts();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  if (isLoading) return <Loading />;
  if (error) return <ErrorMessage message="Failed to load alerts." />;

  const filtered = alerts.filter((a) => (filter === "unread" ? !a.read : true));

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <AppHeader title="Alerts" />
        <View className="flex-row gap-2 px-4">
          {(["all", "unread"] as const).map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              className={`rounded-full px-4 py-2 ${filter === f ? "bg-cyan-500" : "border border-slate-700"}`}
            >
              <Text className={filter === f ? "text-slate-900 font-semibold" : "text-slate-200"}>{f}</Text>
            </Pressable>
          ))}
        </View>
        <View className="px-4">
          {filtered.map((alert) => (
            <AlertCard
              key={alert.id}
              title={alert.title || "Match"}
              subtitle={alert.subtitle}
              timeAgo={alert.timeAgo}
              unread={!alert.read}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
