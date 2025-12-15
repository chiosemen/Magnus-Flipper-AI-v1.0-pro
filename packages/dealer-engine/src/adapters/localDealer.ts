import type { DealerAdapter, DealerLeadInput, DealerOffer, Vehicle } from "../types.js";

/**
 * Local Dealer Adapter (Stub)
 * 
 * Represents a local dealership integration.
 * In production, this would call the dealer's API.
 */
export class LocalDealerAdapter implements DealerAdapter {
  id = "local-dealer-1";
  name = "Local Auto Dealer";

  async submitLead(input: DealerLeadInput): Promise<DealerOffer | null> {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000));

    // Simulate 10% failure rate
    if (Math.random() < 0.1) {
      return null;
    }

    // Calculate offer based on vehicle (simplified)
    const baseOffer = this.calculateBaseOffer(input.vehicle);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    return {
      dealerId: this.id,
      dealerName: this.name,
      offerAmount: baseOffer,
      currency: "USD",
      expiresAt,
      notes: "Contact us to finalize this offer",
      metadata: {
        source: "local-dealer",
        leadId: input.leadId,
      },
    };
  }

  private calculateBaseOffer(vehicle: Vehicle): number {
    // Simplified calculation
    const baseMSRP = 35000;
    const age = new Date().getFullYear() - vehicle.year;
    const depreciation = Math.min(age * 0.1, 0.6);
    const mileageFactor = vehicle.mileage ? Math.min(vehicle.mileage / 200000, 0.3) : 0;

    return Math.round(baseMSRP * (1 - depreciation - mileageFactor) * 0.8);
  }
}

