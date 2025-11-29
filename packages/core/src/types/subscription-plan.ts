export type SubscriptionPlan = {
  id: string;
  name: string;
  price: number;
  interval: "monthly" | "yearly";
};
