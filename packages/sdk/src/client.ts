import axios, { AxiosInstance } from "axios";

export interface SDKClientOptions {
  baseURL?: string;
  apiKey?: string;
}

export class SDKClient {
  axios: AxiosInstance;

  constructor(opts: SDKClientOptions = {}) {
    this.axios = axios.create({
      baseURL: opts.baseURL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
      headers: opts.apiKey ? { Authorization: `Bearer ${opts.apiKey}` } : {}
    });
  }
}
