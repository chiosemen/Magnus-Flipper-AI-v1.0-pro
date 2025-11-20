import { SDKClient } from "../client.js";
import { Watchlist, WatchlistCreateInput } from "../types.js";

export class WatchlistsAPI {
  constructor(private client: SDKClient) {}

  async list(): Promise<Watchlist[]> {
    const res = await this.client.axios.get<Watchlist[]>("/api/watchlists");
    return res.data;
  }

  async create(payload: WatchlistCreateInput): Promise<Watchlist> {
    const res = await this.client.axios.post<Watchlist>("/api/watchlists", payload);
    return res.data;
  }

  async delete(id: string): Promise<{ success: boolean }> {
    const res = await this.client.axios.delete<{ success: boolean }>(`/api/watchlists/${id}`);
    return res.data;
  }
}
