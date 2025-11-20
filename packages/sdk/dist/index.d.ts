import { SDKClientOptions } from "./client.js";
import { DealsAPI } from "./api/deals.js";
import { AlertsAPI } from "./api/alerts.js";
import { WatchlistsAPI } from "./api/watchlists.js";
export { MagnusProvider, useMagnusSDK } from "./provider/MagnusContext.js";
export declare class MagnusSDK {
    deals: DealsAPI;
    alerts: AlertsAPI;
    watchlists: WatchlistsAPI;
    constructor(opts?: SDKClientOptions);
}
export type { SDKClientOptions } from "./client.js";
export * from "./types.js";
export * from "./api/index.js";
