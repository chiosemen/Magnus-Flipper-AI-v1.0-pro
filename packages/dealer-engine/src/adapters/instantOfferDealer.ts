import type { DealerAdapter, DealerLeadInput, DealerOffer, Vehicle } from "../types.js";

/**
 * Instant Offer Dealer Adapter (Stub)
 * 
 * Represents an instant-offer service (e.g., CarMax Instant Offer).
 * In production, this would call the instant-offer API.
 */
export class InstantOfferDealerAdapter implements DealerAdapter {
  id = "instant-offer-dealer-1";
  name = "Instant Auto Offers";

  async submitLead(input: DealerLeadInput): Promise<DealerOffer | null> {
    // Instant offers are typically faster
    await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 1000));

    // Simulate 5% failure rate (instant offers are usually more reliable)
    if (Math.random() < 0.05) {
      return null;
    }

    const baseOffer = this.calculateBaseOffer(input.vehicle);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

    return {
      dealerId: this.id,
      dealerName: this.name,
      offerAmount: baseOffer,
      currency: "USD",
      expiresAt,
      notes: "Valid for 24 hours - instant cash offer",
      metadata: {
        source: "instant-offer",
        leadId: input.leadId,
      },
    };
  }

  private calculateBaseOffer(vehicle: Vehicle): number {
    const baseMSRP = 35000;
    const age = new Date().getFullYear() - vehicle.year;
    const depreciation = Math.min(age * 0.08, 0.55);
    const mileageFactor = vehicle.mileage ? Math.min(vehicle.mileage / 200000, 0.25) : 0;

    // Instant offers can be competitive
    return Math.round(baseMSRP * (1 - depreciation - mileageFactor) * 0.82);
  }
}

