import { SDKClient, SDKClientOptions } from "./client.js";
import { AlertsAPI } from "./api/alerts.js";
import { DealsAPI } from "./api/deals.js";
import { WatchlistsAPI } from "./api/watchlists.js";

export class MagnusSDK {
  deals: DealsAPI;
  alerts: AlertsAPI;
  watchlists: WatchlistsAPI;

  constructor(opts: SDKClientOptions = {}) {
    const client = new SDKClient(opts);
    this.deals = new DealsAPI(client);
    this.alerts = new AlertsAPI(client);
    this.watchlists = new WatchlistsAPI(client);
  }
}

export type { SDKClientOptions } from "./client.js";
