import { SDKClient } from "../client.js";
import { Alert } from "../types.js";

export interface AlertCreateInput {
  user_id: string;
  deal_id: string;
  channel: "email" | "sms" | "push";
}

export class AlertsAPI {
  constructor(private client: SDKClient) {}

  async create(payload: AlertCreateInput): Promise<Alert> {
    const res = await this.client.axios.post<Alert>("/api/alerts", payload);
    return res.data;
  }

  async list(): Promise<Alert[]> {
    const res = await this.client.axios.get<Alert[]>("/api/alerts");
    return res.data;
  }
}
