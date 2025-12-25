/**
 * Sale Detector
 * Polls marketplaces for sale events and normalizes them
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import axios from "axios";
import type { SaleEvent } from "../schemas/SaleEvent.js";

let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) return supabaseClient;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Supabase not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing)"
    );
  }

  supabaseClient = createClient(supabaseUrl, supabaseKey);
  return supabaseClient;
}

export interface MarketplaceSalePoller {
  marketplace: string;
  pollSales: () => Promise<SaleEvent[]>;
}

/**
 * eBay Sale Detector
 * Uses eBay Order API to detect sold items
 */
export class EbaySaleDetector implements MarketplaceSalePoller {
  marketplace = "ebay";
  private apiKey: string;
  private token: string;

  constructor(apiKey: string, token: string) {
    this.apiKey = apiKey;
    this.token = token;
  }

  async pollSales(): Promise<SaleEvent[]> {
    try {
      const response = await axios.get(
        "https://api.ebay.com/sell/fulfillment/v1/order",
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
            "Content-Type": "application/json",
          },
          params: {
            filter: "orderfulfillmentstatus:{NOT_STARTED|IN_PROGRESS}",
            limit: 50,
          },
        }
      );

      const orders = response.data.orders || [];
      return orders.map((order: any) => this.normalizeEbaySale(order));
    } catch (error) {
      console.error("eBay sale polling failed:", error);
      return [];
    }
  }

  private normalizeEbaySale(order: any): SaleEvent {
    const lineItem = order.lineItems[0];
    return {
      id: `ebay_${order.orderId}`,
      listingId: lineItem.listingMarketplaceId,
      inventoryItemId: lineItem.sku || lineItem.listingMarketplaceId,
      marketplace: "ebay",
      salePrice: parseFloat(lineItem.total.value),
      currency: lineItem.total.currency as "USD" | "GBP" | "EUR",
      buyerInfo: {
        id: order.buyer.username,
        name: order.buyer.buyerRegistrationAddress?.fullName,
        location: order.buyer.buyerRegistrationAddress?.city,
        verified: true,
      },
      soldAt: order.creationDate,
      shippingRequired: true,
      shippingAddress: order.fulfillmentStartInstructions?.[0]?.shippingStep
        ?.shipTo
        ? {
            line1:
              order.fulfillmentStartInstructions[0].shippingStep.shipTo
                .contactAddress.addressLine1,
            line2:
              order.fulfillmentStartInstructions[0].shippingStep.shipTo
                .contactAddress.addressLine2,
            city: order.fulfillmentStartInstructions[0].shippingStep.shipTo
              .contactAddress.city,
            state:
              order.fulfillmentStartInstructions[0].shippingStep.shipTo
                .contactAddress.stateOrProvince,
            postalCode:
              order.fulfillmentStartInstructions[0].shippingStep.shipTo
                .contactAddress.postalCode,
            country:
              order.fulfillmentStartInstructions[0].shippingStep.shipTo
                .contactAddress.countryCode,
          }
        : undefined,
      rawEvent: order,
    };
  }
}

/**
 * Vinted Sale Detector
 * Uses Vinted private API to detect sold items
 */
export class VintedSaleDetector implements MarketplaceSalePoller {
  marketplace = "vinted";
  private sessionCookie: string;

  constructor(sessionCookie: string) {
    this.sessionCookie = sessionCookie;
  }

  async pollSales(): Promise<SaleEvent[]> {
    try {
      const response = await axios.get(
        "https://www.vinted.com/api/v2/transactions/sales",
        {
          headers: {
            Cookie: `_vinted_fr_session=${this.sessionCookie}`,
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
          },
          params: {
            page: 1,
            per_page: 20,
          },
        }
      );

      const transactions = response.data.transactions || [];
      return transactions.map((tx: any) => this.normalizeVintedSale(tx));
    } catch (error) {
      console.error("Vinted sale polling failed:", error);
      return [];
    }
  }

  private normalizeVintedSale(tx: any): SaleEvent {
    return {
      id: `vinted_${tx.id}`,
      listingId: tx.item?.id?.toString() || "",
      inventoryItemId: tx.item?.id?.toString() || "",
      marketplace: "vinted",
      salePrice: parseFloat(tx.total_item_price || 0),
      currency: (tx.total_item_price_currency || "USD") as
        | "USD"
        | "GBP"
        | "EUR",
      buyerInfo: {
        id: tx.buyer?.id?.toString() || "",
        name: tx.buyer?.login,
        location: tx.buyer?.city,
        verified: tx.buyer?.verification?.email?.valid || false,
      },
      soldAt: tx.created_at,
      shippingRequired: true,
      shippingAddress: undefined, // Vinted handles shipping internally
      rawEvent: tx,
    };
  }
}

/**
 * Depop Sale Detector
 * Uses Depop receipts API
 */
export class DepopSaleDetector implements MarketplaceSalePoller {
  marketplace = "depop";
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async pollSales(): Promise<SaleEvent[]> {
    try {
      const response = await axios.get(
        "https://webapi.depop.com/api/v1/receipts/",
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
          params: {
            offset: 0,
            limit: 20,
          },
        }
      );

      const receipts = response.data.objects || [];
      return receipts.map((receipt: any) => this.normalizeDepopSale(receipt));
    } catch (error) {
      console.error("Depop sale polling failed:", error);
      return [];
    }
  }

  private normalizeDepopSale(receipt: any): SaleEvent {
    return {
      id: `depop_${receipt.id}`,
      listingId: receipt.product?.id?.toString() || "",
      inventoryItemId: receipt.product?.id?.toString() || "",
      marketplace: "depop",
      salePrice: parseFloat(receipt.price_amount || 0),
      currency: (receipt.price_currency || "USD") as "USD" | "GBP" | "EUR",
      buyerInfo: {
        id: receipt.buyer?.id?.toString() || "",
        name: receipt.buyer?.username,
        location: receipt.buyer?.country_code,
        verified: receipt.buyer?.verified || false,
      },
      soldAt: receipt.date_created,
      shippingRequired: true,
      shippingAddress: receipt.address
        ? {
            line1: receipt.address.address_line_1,
            line2: receipt.address.address_line_2,
            city: receipt.address.city,
            state: receipt.address.state,
            postalCode: receipt.address.postcode,
            country: receipt.address.country_code,
          }
        : undefined,
      rawEvent: receipt,
    };
  }
}

/**
 * Facebook Marketplace Sale Detector
 * Scrapes Facebook Marketplace order history
 */
export class FacebookSaleDetector implements MarketplaceSalePoller {
  marketplace = "facebook";
  private sessionCookies: string;

  constructor(sessionCookies: string) {
    this.sessionCookies = sessionCookies;
  }

  async pollSales(): Promise<SaleEvent[]> {
    try {
      // Facebook requires session-based scraping
      // This is a simplified version - production would use Playwright/Puppeteer
      const response = await axios.get(
        "https://www.facebook.com/marketplace/you/selling",
        {
          headers: {
            Cookie: this.sessionCookies,
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
          },
        }
      );

      // Would parse HTML to extract sold items
      // For now, return empty array
      return [];
    } catch (error) {
      console.error("Facebook sale polling failed:", error);
      return [];
    }
  }
}

/**
 * OfferUp Sale Detector
 * Uses OfferUp seller dashboard API
 */
export class OfferUpSaleDetector implements MarketplaceSalePoller {
  marketplace = "offerup";
  private authToken: string;

  constructor(authToken: string) {
    this.authToken = authToken;
  }

  async pollSales(): Promise<SaleEvent[]> {
    try {
      const response = await axios.get(
        "https://offerup.com/api/v2/transactions",
        {
          headers: {
            Authorization: `Bearer ${this.authToken}`,
          },
          params: {
            type: "sales",
            limit: 20,
          },
        }
      );

      const transactions = response.data.data || [];
      return transactions.map((tx: any) => this.normalizeOfferUpSale(tx));
    } catch (error) {
      console.error("OfferUp sale polling failed:", error);
      return [];
    }
  }

  private normalizeOfferUpSale(tx: any): SaleEvent {
    return {
      id: `offerup_${tx.id}`,
      listingId: tx.item?.id?.toString() || "",
      inventoryItemId: tx.item?.id?.toString() || "",
      marketplace: "offerup",
      salePrice: parseFloat(tx.amount || 0),
      currency: "USD",
      buyerInfo: {
        id: tx.buyer?.id?.toString() || "",
        name: tx.buyer?.name,
        location: tx.buyer?.location,
        verified: tx.buyer?.verified || false,
      },
      soldAt: tx.created_at,
      shippingRequired: tx.shipping_required || false,
      shippingAddress: tx.shipping_address
        ? {
            line1: tx.shipping_address.street,
            city: tx.shipping_address.city,
            state: tx.shipping_address.state,
            postalCode: tx.shipping_address.zip,
            country: "US",
          }
        : undefined,
      rawEvent: tx,
    };
  }
}

/**
 * Main sale detection orchestrator
 * Polls all marketplaces and returns unified sale events
 */
export async function detectSales(): Promise<SaleEvent[]> {
  const sales: SaleEvent[] = [];

  // Initialize detectors with credentials from database
  const detectors = await initializeDetectors();

  // Poll all marketplaces in parallel
  const results = await Promise.allSettled(
    detectors.map((detector) => detector.pollSales())
  );

  for (const result of results) {
    if (result.status === "fulfilled") {
      sales.push(...result.value);
    } else {
      console.error("Sale detection failed:", result.reason);
    }
  }

  // Filter out duplicates and already-processed sales
  const uniqueSales = await deduplicateSales(sales);

  // Store sale events in database
  await storeSaleEvents(uniqueSales);

  return uniqueSales;
}

async function initializeDetectors(): Promise<MarketplaceSalePoller[]> {
  const detectors: MarketplaceSalePoller[] = [];

  // Load marketplace credentials from Supabase
  const { data: credentials } = await getSupabaseClient()
    .from("marketplace_credentials")
    .select("*")
    .eq("active", true);

  if (!credentials) return detectors;

  for (const cred of credentials) {
    switch (cred.marketplace) {
      case "ebay":
        if (cred.api_key && cred.access_token) {
          detectors.push(new EbaySaleDetector(cred.api_key, cred.access_token));
        }
        break;
      case "vinted":
        if (cred.session_cookie) {
          detectors.push(new VintedSaleDetector(cred.session_cookie));
        }
        break;
      case "depop":
        if (cred.access_token) {
          detectors.push(new DepopSaleDetector(cred.access_token));
        }
        break;
      case "facebook":
        if (cred.session_cookies) {
          detectors.push(new FacebookSaleDetector(cred.session_cookies));
        }
        break;
      case "offerup":
        if (cred.auth_token) {
          detectors.push(new OfferUpSaleDetector(cred.auth_token));
        }
        break;
    }
  }

  return detectors;
}

async function deduplicateSales(sales: SaleEvent[]): Promise<SaleEvent[]> {
  const saleIds = sales.map((s) => s.id);

  const { data: existing } = await getSupabaseClient()
    .from("sold_items")
    .select("sale_event_id")
    .in("sale_event_id", saleIds);

  const existingIds = new Set(existing?.map((e) => e.sale_event_id) || []);

  return sales.filter((sale) => !existingIds.has(sale.id));
}

async function storeSaleEvents(sales: SaleEvent[]): Promise<void> {
  if (sales.length === 0) return;

  const records = sales.map((sale) => ({
    sale_event_id: sale.id,
    listing_id: sale.listingId,
    inventory_item_id: sale.inventoryItemId,
    marketplace: sale.marketplace,
    sale_price: sale.salePrice,
    currency: sale.currency,
    buyer_id: sale.buyerInfo.id,
    buyer_name: sale.buyerInfo.name,
    buyer_location: sale.buyerInfo.location,
    sold_at: sale.soldAt,
    shipping_required: sale.shippingRequired,
    shipping_address: sale.shippingAddress,
    raw_event: sale.rawEvent,
    status: "pending_finalization",
    created_at: new Date().toISOString(),
  }));

  const { error } = await getSupabaseClient()
    .from("sale_events")
    .insert(records);

  if (error) {
    console.error("Failed to store sale events:", error);
  }
}
