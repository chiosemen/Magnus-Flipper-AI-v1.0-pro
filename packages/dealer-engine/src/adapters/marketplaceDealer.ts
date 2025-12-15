import type { DealerAdapter, DealerLeadInput, DealerOffer, Vehicle } from "../types.js";

/**
 * Marketplace Dealer Adapter (Stub)
 * 
 * Represents a marketplace-style dealer (e.g., Carvana, Vroom).
 * In production, this would call the marketplace API.
 */
export class MarketplaceDealerAdapter implements DealerAdapter {
  id = "marketplace-dealer-1";
  name = "Marketplace Auto";

  async submitLead(input: DealerLeadInput): Promise<DealerOffer | null> {
    // Simulate API call delay (marketplace APIs are typically slower)
    await new Promise((resolve) => setTimeout(resolve, 2000 + Math.random() * 3000));

    // Simulate 15% failure rate (marketplaces can be less reliable)
    if (Math.random() < 0.15) {
      return null;
    }

    const baseOffer = this.calculateBaseOffer(input.vehicle);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14); // 14 days

    return {
      dealerId: this.id,
      dealerName: this.name,
      offerAmount: baseOffer,
      currency: "USD",
      expiresAt,
      notes: "Instant offer - no haggling",
      metadata: {
        source: "marketplace",
        leadId: input.leadId,
      },
    };
  }

  private calculateBaseOffer(vehicle: Vehicle): number {
    const baseMSRP = 35000;
    const age = new Date().getFullYear() - vehicle.year;
    const depreciation = Math.min(age * 0.12, 0.65);
    const mileageFactor = vehicle.mileage ? Math.min(vehicle.mileage / 200000, 0.35) : 0;

    // Marketplace dealers typically offer slightly less
    return Math.round(baseMSRP * (1 - depreciation - mileageFactor) * 0.75);
  }
}

