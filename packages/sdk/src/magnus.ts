import { SDKClient, SDKClientOptions } from "./client";
import { AlertsAPI } from "./api/alerts";
import { DealsAPI } from "./api/deals";
import { WatchlistsAPI } from "./api/watchlists";

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

export type { SDKClientOptions } from "./client";
