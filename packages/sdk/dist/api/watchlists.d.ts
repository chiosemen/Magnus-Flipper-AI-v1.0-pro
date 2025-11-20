import { SDKClient } from "../client.js";
import { Watchlist, WatchlistCreateInput } from "../types.js";
export declare class WatchlistsAPI {
    private client;
    constructor(client: SDKClient);
    list(): Promise<Watchlist[]>;
    create(payload: WatchlistCreateInput): Promise<Watchlist>;
    delete(id: string): Promise<{
        success: boolean;
    }>;
}
