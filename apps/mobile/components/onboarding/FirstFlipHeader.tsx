import { View, Text } from "react-native";

type Props = {
  status?: "active" | "trialing" | "trial_expired" | "none";
  trialEndsAt?: string;
};

export function FirstFlipHeader({ status, trialEndsAt }: Props) {
  let banner: string | null = null;

  if (status === "trialing") {
    if (trialEndsAt) {
      const ends = new Date(trialEndsAt).getTime();
      const now = Date.now();
      const hoursLeft = (ends - now) / (1000 * 60 * 60);
      banner = hoursLeft <= 48 ? "Upgrade soon – trial ending" : "Trialing – 7 days to your first flip";
    } else {
      banner = "Trialing – 7 days to your first flip";
    }
  } else if (status === "trial_expired") {
    banner = "Upgrade to continue";
  }

  return (
    <View className="space-y-3">
      {banner ? (
        <View className="rounded-full border border-cyan-400/50 bg-cyan-500/10 px-3 py-1">
          <Text className="text-xs font-semibold text-cyan-200">{banner}</Text>
        </View>
      ) : null}
      <Text className="text-3xl font-bold text-white">Your First Flip, Step-by-Step</Text>
      <Text className="text-sm text-slate-300">
        We’ll guide you from zero to your first profitable flip. Follow the steps below.
      </Text>
    </View>
  );
}
