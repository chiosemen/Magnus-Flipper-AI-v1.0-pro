import { AxiosInstance } from "axios";
export interface SDKClientOptions {
    baseURL?: string;
    apiKey?: string;
}
export declare class SDKClient {
    axios: AxiosInstance;
    constructor(opts?: SDKClientOptions);
}
