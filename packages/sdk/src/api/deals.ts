import { SDKClient } from "../client.js";
import { DealsResponse } from "../types.js";

export class DealsAPI {
  constructor(private client: SDKClient) {}

  async list(minScore?: number): Promise<DealsResponse> {
    const res = await this.client.axios.get<DealsResponse>("/api/deals", {
      params: minScore != null ? { minScore } : {}
    });
    return res.data;
  }
}
