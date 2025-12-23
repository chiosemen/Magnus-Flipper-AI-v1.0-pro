export interface FlipbombScanPayload {
  brand: string;
  model: string;
  storage?: string;
  condition: string;
  maxPrice?: number;
  region?: "US" | "UK";
}

export interface FlipbombScanResponse {
  jobId: string;
}

