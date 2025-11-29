/**
 * Factory function for creating Magnus SDK client
 * Compatible with mobile app expectations
 */
import { MagnusSDK } from "./magnus";
import { SDKClientOptions } from "./client";

export interface CreateMagnusClientOptions {
  baseUrl?: string;
  apiKey?: string;
  timeoutMs?: number;
}

/**
 * Create a new Magnus SDK client instance
 * @param options - Client configuration options
 * @returns Configured Magnus SDK client
 */
export function createMagnusSDK(options: CreateMagnusClientOptions = {}): MagnusSDK {
  const sdkOptions: SDKClientOptions = {
    baseURL: options.baseUrl,
    apiKey: options.apiKey,
  };

  return new MagnusSDK(sdkOptions);
}

// Alias for backwards compatibility
export const createMagnusClient = createMagnusSDK;
