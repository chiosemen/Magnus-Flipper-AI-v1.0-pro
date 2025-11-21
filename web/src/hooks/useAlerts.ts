"use client";

import { useState } from "react";
import { MagnusSDK, Alert } from "@magnus-flipper-ai/sdk";

const sdk = new MagnusSDK({ baseURL: process.env.NEXT_PUBLIC_API_URL });

type CreateAlertInput = {
  user_id: string;
  deal_id: string;
  channel: "email" | "sms" | "push";
};

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetchAlerts() {
    setLoading(true);
    try {
      const data = await sdk.alerts.list();
      setAlerts(data);
    } catch (err) {
      console.error("Failed fetching alerts", err);
    } finally {
      setLoading(false);
    }
  }

  async function createAlert(payload: CreateAlertInput) {
    try {
      const newAlert = await sdk.alerts.create(payload);
      setAlerts((prev) => [...prev, newAlert]);
      return newAlert;
    } catch (err) {
      console.error("Failed creating alert", err);
      throw err;
    }
  }

  return { alerts, loading, fetchAlerts, createAlert };
}
