/**
 * Dealer Engine Types
 */

export interface Vehicle {
  make: string;
  model: string;
  year: number;
  mileage?: number;
  condition?: string;
}

export interface DealerOffer {
  dealerId: string;
  dealerName: string;
  offerAmount: number;
  currency: string;
  expiresAt?: Date;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface DealerLeadInput {
  leadId: string;
  vehicle: Vehicle;
  location?: string;
  zip?: string;
  email?: string;
  phone?: string;
}

export interface DealerAdapter {
  id: string;
  name: string;
  submitLead(input: DealerLeadInput): Promise<DealerOffer | null>;
}

