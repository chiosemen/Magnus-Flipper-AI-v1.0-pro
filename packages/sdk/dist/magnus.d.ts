import { SDKClientOptions } from "./client.js";
import { AlertsAPI } from "./api/alerts.js";
import { DealsAPI } from "./api/deals.js";
import { WatchlistsAPI } from "./api/watchlists.js";
export declare class MagnusSDK {
    deals: DealsAPI;
    alerts: AlertsAPI;
    watchlists: WatchlistsAPI;
    constructor(opts?: SDKClientOptions);
}
export type { SDKClientOptions } from "./client.js";
