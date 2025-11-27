import { api } from "./api";

export function useTrial() {
  const startTrial = async () => {
    const res = await api.plan.trial();
    return res as { url?: string; trial_expires_at?: string };
  };

  return { startTrial };
}
