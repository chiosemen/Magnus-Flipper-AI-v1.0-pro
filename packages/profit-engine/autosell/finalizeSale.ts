/**
 * Sale Finalization Engine
 * Calculates P&L, creates ledger entries, and updates inventory
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { SaleEvent, FinalizedSale } from "../schemas/SaleEvent.js";
import { lockListingAcrossPlatforms } from "./crossPlatformLock.js";
import { calculateMarketplaceFees } from "../ledger/feeModel.js";

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

export interface FinalizationResult {
  success: boolean;
  finalizedSale?: FinalizedSale;
  error?: string;
  lockResult?: any;
}

/**
 * Finalize a sale event
 * 1. Calculate all fees and costs
 * 2. Calculate profit and ROI
 * 3. Lock other platform listings
 * 4. Create ledger entries
 * 5. Update inventory status
 */
export async function finalizeSale(
  saleEvent: SaleEvent
): Promise<FinalizationResult> {
  try {
    // Get inventory item details
    const { data: item, error: itemError } = await getSupabaseClient()
      .from("inventory")
      .select("*")
      .eq("id", saleEvent.inventoryItemId)
      .single();

    if (itemError || !item) {
      return {
        success: false,
        error: `Inventory item not found: ${saleEvent.inventoryItemId}`,
      };
    }

    // Calculate marketplace fees
    const fees = calculateMarketplaceFees(
      saleEvent.marketplace,
      saleEvent.salePrice,
      item.category
    );

    // Estimate shipping cost
    const shippingCost = saleEvent.shippingRequired
      ? await estimateShippingCost(item, saleEvent.shippingAddress)
      : 0;

    // Calculate profit metrics
    const acquiredPrice = item.acquired_price || 0;
    const otherCosts = item.other_costs || 0;
    const grossProfit = saleEvent.salePrice - acquiredPrice;
    const netProfit = grossProfit - fees.totalFees - shippingCost - otherCosts;
    const roi = acquiredPrice > 0 ? (netProfit / acquiredPrice) * 100 : 0;

    // Calculate holding time
    const acquiredAt = new Date(item.acquired_at || item.created_at);
    const soldAt = new Date(saleEvent.soldAt);
    const holdingTime = Math.floor(
      (soldAt.getTime() - acquiredAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Create finalized sale record
    const finalizedSale: FinalizedSale = {
      id: `sale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      saleEventId: saleEvent.id,
      listingId: saleEvent.listingId,
      inventoryItemId: saleEvent.inventoryItemId,
      marketplace: saleEvent.marketplace,
      salePrice: saleEvent.salePrice,
      acquiredPrice,
      marketplaceFees: fees.totalFees,
      shippingCost,
      otherCosts,
      grossProfit,
      netProfit,
      roi,
      holdingTime,
      soldAt: saleEvent.soldAt,
      finalizedAt: new Date().toISOString(),
      status: "pending_shipment",
      metadata: {
        feeBreakdown: fees,
        buyerInfo: saleEvent.buyerInfo,
        shippingAddress: saleEvent.shippingAddress,
      },
    };

    // Store finalized sale
    const { error: saleError } = await getSupabaseClient()
      .from("sold_items")
      .insert({
      id: finalizedSale.id,
      sale_event_id: finalizedSale.saleEventId,
      listing_id: finalizedSale.listingId,
      inventory_item_id: finalizedSale.inventoryItemId,
      user_id: item.user_id,
      marketplace: finalizedSale.marketplace,
      sale_price: finalizedSale.salePrice,
      acquired_price: finalizedSale.acquiredPrice,
      marketplace_fees: finalizedSale.marketplaceFees,
      shipping_cost: finalizedSale.shippingCost,
      other_costs: finalizedSale.otherCosts,
      gross_profit: finalizedSale.grossProfit,
      net_profit: finalizedSale.netProfit,
      roi: finalizedSale.roi,
      holding_time: finalizedSale.holdingTime,
      sold_at: finalizedSale.soldAt,
      finalized_at: finalizedSale.finalizedAt,
      status: finalizedSale.status,
      metadata: finalizedSale.metadata,
      created_at: new Date().toISOString(),
    });

    if (saleError) {
      return {
        success: false,
        error: `Failed to store sale: ${saleError.message}`,
      };
    }

    // Lock other platform listings
    const lockResult = await lockListingAcrossPlatforms(
      saleEvent.inventoryItemId,
      saleEvent.marketplace,
      saleEvent.id
    );

    // Create ledger entries
    await createLedgerEntries(finalizedSale, item.user_id);

    // Update inventory status
    await getSupabaseClient()
      .from("inventory")
      .update({
        status: "sold",
        sold_at: finalizedSale.soldAt,
        sale_price: finalizedSale.salePrice,
        net_profit: finalizedSale.netProfit,
        roi: finalizedSale.roi,
      })
      .eq("id", saleEvent.inventoryItemId);

    // Update sale event status
    await getSupabaseClient()
      .from("sale_events")
      .update({
        status: "finalized",
        finalized_at: finalizedSale.finalizedAt,
      })
      .eq("sale_event_id", saleEvent.id);

    return {
      success: true,
      finalizedSale,
      lockResult,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Estimate shipping cost based on item dimensions and destination
 */
async function estimateShippingCost(
  item: any,
  shippingAddress?: any
): Promise<number> {
  // Simple weight-based estimation
  // In production, integrate with USPS/UPS/FedEx APIs

  const weight = item.weight_oz || 16; // default 1 lb
  const dimensions = item.dimensions || { length: 12, width: 9, height: 3 };

  // Domestic shipping estimation
  if (!shippingAddress || shippingAddress.country === "US") {
    if (weight <= 16) {
      // Under 1 lb - USPS First Class
      return 4.5;
    } else if (weight <= 64) {
      // 1-4 lbs - USPS Priority
      return 8.5;
    } else if (weight <= 160) {
      // 4-10 lbs - USPS Priority
      return 15.0;
    } else {
      // Over 10 lbs - UPS Ground
      return 25.0;
    }
  }

  // International shipping
  if (weight <= 16) {
    return 25.0; // USPS First Class International
  } else if (weight <= 64) {
    return 50.0; // USPS Priority International
  } else {
    return 100.0; // UPS/FedEx International
  }
}

/**
 * Create ledger entries for a finalized sale
 */
async function createLedgerEntries(
  sale: FinalizedSale,
  userId: string
): Promise<void> {
  const entries = [
    // Sale revenue entry
    {
      id: `ledger_${Date.now()}_sale`,
      user_id: userId,
      inventory_item_id: sale.inventoryItemId,
      sale_id: sale.id,
      type: "sale",
      amount: sale.salePrice,
      currency: "USD",
      description: `Sale on ${sale.marketplace} - ${sale.inventoryItemId}`,
      transaction_date: sale.soldAt,
      marketplace: sale.marketplace,
      created_at: new Date().toISOString(),
    },
    // Fee entry
    {
      id: `ledger_${Date.now()}_fee`,
      user_id: userId,
      inventory_item_id: sale.inventoryItemId,
      sale_id: sale.id,
      type: "fee",
      amount: -sale.marketplaceFees,
      currency: "USD",
      description: `${sale.marketplace} fees`,
      transaction_date: sale.soldAt,
      marketplace: sale.marketplace,
      created_at: new Date().toISOString(),
    },
    // Shipping entry
    {
      id: `ledger_${Date.now()}_ship`,
      user_id: userId,
      inventory_item_id: sale.inventoryItemId,
      sale_id: sale.id,
      type: "shipping",
      amount: -sale.shippingCost,
      currency: "USD",
      description: "Shipping cost",
      transaction_date: sale.soldAt,
      marketplace: sale.marketplace,
      created_at: new Date().toISOString(),
    },
  ];

  await getSupabaseClient().from("ledger_entries").insert(entries);
}

/**
 * Batch finalize multiple sales
 */
export async function finalizeSalesBatch(
  saleEvents: SaleEvent[]
): Promise<FinalizationResult[]> {
  const results = await Promise.all(
    saleEvents.map((event) => finalizeSale(event))
  );

  return results;
}

/**
 * Update sale status (e.g., shipped, delivered)
 */
export async function updateSaleStatus(
  saleId: string,
  status: "pending_shipment" | "shipped" | "delivered" | "completed" | "refunded",
  trackingNumber?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (trackingNumber) {
      updateData.tracking_number = trackingNumber;
    }

    if (status === "shipped") {
      updateData.shipped_at = new Date().toISOString();
    } else if (status === "delivered") {
      updateData.delivered_at = new Date().toISOString();
    } else if (status === "completed") {
      updateData.completed_at = new Date().toISOString();
    }

    const { error } = await getSupabaseClient()
      .from("sold_items")
      .update(updateData)
      .eq("id", saleId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Process refund
 */
export async function processRefund(
  saleId: string,
  refundAmount: number,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: sale, error: saleError } = await getSupabaseClient()
      .from("sold_items")
      .select("*")
      .eq("id", saleId)
      .single();

    if (saleError || !sale) {
      return { success: false, error: "Sale not found" };
    }

    // Update sale status
    await getSupabaseClient()
      .from("sold_items")
      .update({
        status: "refunded",
        refund_amount: refundAmount,
        refund_reason: reason,
        refunded_at: new Date().toISOString(),
      })
      .eq("id", saleId);

    // Create refund ledger entry
    await getSupabaseClient().from("ledger_entries").insert({
      id: `ledger_${Date.now()}_refund`,
      user_id: sale.user_id,
      inventory_item_id: sale.inventory_item_id,
      sale_id: saleId,
      type: "refund",
      amount: -refundAmount,
      currency: "USD",
      description: `Refund: ${reason}`,
      transaction_date: new Date().toISOString(),
      marketplace: sale.marketplace,
      created_at: new Date().toISOString(),
    });

    // Update inventory status back to available
    await getSupabaseClient()
      .from("inventory")
      .update({
        status: "available",
        sold_at: null,
        sale_price: null,
        net_profit: null,
        roi: null,
      })
      .eq("id", sale.inventory_item_id);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
