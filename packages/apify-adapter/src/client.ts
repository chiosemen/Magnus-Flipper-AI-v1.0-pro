import { ApifyClient } from "apify-client";

/**
 * Initialize Apify client from environment token
 */
export function createApifyClient(): ApifyClient {
  const token = process.env.APIFY_TOKEN;
  
  if (!token) {
    throw new Error(
      "APIFY_TOKEN environment variable is required. " +
      "APIFY_TOKEN=apify_api_a7OoQX4nRigHsDTVLhgsbghLjiQ7Nm0y5ODD"
    );
  }
  
  return new ApifyClient({ token });
}

/**
 * Singleton Apify client instance
 */
let clientInstance: ApifyClient | null = null;

/**
 * Get or create Apify client instance
 */
export function getApifyClient(): ApifyClient {
  if (!clientInstance) {
    clientInstance = createApifyClient();
  }
  return clientInstance;
}

