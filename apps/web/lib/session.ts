import { createSupabaseServer, getUser } from "./supabase/server";
import { SubscriptionTier } from "@/types/subscription";
import {
  getUserSubscription,
  getTierFromPriceId,
  isActiveSubscription,
} from "./subscription";

export interface SignedInUser {
  id: string;
  email: string;
  tier: SubscriptionTier;
}

export async function getSignedInUser(): Promise<SignedInUser | null> {
  const user = await getUser();

  if (!user) {
    return null;
  }

  const supabase = await createSupabaseServer();

  const { data: dbUser } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!dbUser) {
    return null;
  }

  const subscription = await getUserSubscription(user.id);

  let tier = SubscriptionTier.FREE;

  if (subscription && isActiveSubscription(subscription.status)) {
    tier = getTierFromPriceId(subscription.stripe_price_id);
  }

  return {
    id: user.id,
    email: user.email!,
    tier,
  };
}
