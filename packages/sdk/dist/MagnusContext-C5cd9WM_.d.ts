import * as react_jsx_runtime from 'react/jsx-runtime';
import React from 'react';
import { AxiosInstance } from 'axios';

interface SDKClientOptions {
    baseURL?: string;
    apiKey?: string;
}
declare class SDKClient {
    axios: AxiosInstance;
    constructor(opts?: SDKClientOptions);
}

interface Deal {
    id: string;
    title: string;
    price: number;
    currency: string;
    score: number;
    url: string;
    created_at: string;
}
interface DealsResponse {
    deals: Deal[];
}
interface Alert {
    id: string;
    user_id: string;
    deal_id: string;
    channel: "email" | "sms" | "push";
    status: "pending" | "sent" | "failed";
    sent_at?: string;
}
interface Watchlist {
    id: string;
    user_id: string;
    name: string;
    keywords: string[];
    min_price?: number;
    max_price?: number;
    created_at: string;
}
interface WatchlistCreateInput {
    name: string;
    keywords: string[];
    min_price?: number;
    max_price?: number;
}

interface AlertCreateInput {
    user_id: string;
    deal_id: string;
    channel: "email" | "sms" | "push";
}
declare class AlertsAPI {
    private client;
    constructor(client: SDKClient);
    create(payload: AlertCreateInput): Promise<Alert>;
    list(): Promise<Alert[]>;
}

declare class DealsAPI {
    private client;
    constructor(client: SDKClient);
    list(minScore?: number): Promise<DealsResponse>;
}

declare class WatchlistsAPI {
    private client;
    constructor(client: SDKClient);
    list(): Promise<Watchlist[]>;
    create(payload: WatchlistCreateInput): Promise<Watchlist>;
    delete(id: string): Promise<{
        success: boolean;
    }>;
}

declare class MagnusSDK {
    deals: DealsAPI;
    alerts: AlertsAPI;
    watchlists: WatchlistsAPI;
    constructor(opts?: SDKClientOptions);
}

declare function MagnusProvider({ children, options }: {
    children: React.ReactNode;
    options?: SDKClientOptions;
}): react_jsx_runtime.JSX.Element;
declare function useMagnusSDK(): MagnusSDK;

export { MagnusSDK as M, type SDKClientOptions as S, SDKClient as a, MagnusProvider as b, useMagnusSDK as u };
