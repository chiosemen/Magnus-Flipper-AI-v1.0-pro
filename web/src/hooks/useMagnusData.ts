"use client";

import { useEffect, useState } from "react";
import { useMagnusSDK } from "@magnus-flipper-ai/sdk";

export function useMagnusData() {
  const sdk = useMagnusSDK();
  const [deals, setDeals] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    sdk.deals.list().then((res) => setDeals(res.deals)).catch(() => setDeals([]));
    sdk.alerts.list().then((data) => setAlerts(data)).catch(() => setAlerts([]));
  }, [sdk]);

  return { deals, alerts };
}
