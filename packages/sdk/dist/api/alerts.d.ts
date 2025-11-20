import { SDKClient } from "../client.js";
import { Alert } from "../types.js";
export interface AlertCreateInput {
    user_id: string;
    deal_id: string;
    channel: "email" | "sms" | "push";
}
export declare class AlertsAPI {
    private client;
    constructor(client: SDKClient);
    create(payload: AlertCreateInput): Promise<Alert>;
    list(): Promise<Alert[]>;
}
