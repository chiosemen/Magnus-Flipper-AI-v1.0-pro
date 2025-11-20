import { SDKClient } from "../client.js";
import { DealsResponse } from "../types.js";
export declare class DealsAPI {
    private client;
    constructor(client: SDKClient);
    list(minScore?: number): Promise<DealsResponse>;
}
