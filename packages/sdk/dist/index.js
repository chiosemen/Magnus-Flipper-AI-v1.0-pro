import { SDKClient } from "./client.js";
import { DealsAPI } from "./api/deals.js";
import { AlertsAPI } from "./api/alerts.js";
import { WatchlistsAPI } from "./api/watchlists.js";
export { MagnusProvider, useMagnusSDK } from "./provider/MagnusContext.js";
export class MagnusSDK {
    deals;
    alerts;
    watchlists;
    constructor(opts = {}) {
        const client = new SDKClient(opts);
        this.deals = new DealsAPI(client);
        this.alerts = new AlertsAPI(client);
        this.watchlists = new WatchlistsAPI(client);
    }
}
export * from "./types.js";
export * from "./api/index.js";
