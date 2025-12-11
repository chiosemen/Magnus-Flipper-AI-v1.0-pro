// Minimal Prisma client shims for build-time type resolution in this package.
// This is a temporary workaround until prisma generate succeeds in CI.
declare module '@prisma/client' {
  export interface ScrapeRun {
    id: string;
    marketplace: string;
    outcome: string;
    success: boolean;
    errorMessage?: string | null;
    durationMs?: number | null;
    createdAt: Date;
  }

  export interface MarketplaceControl {
    marketplace: string;
    isPaused: boolean;
    enabled: boolean;
    maxConcurrency: number;
    updatedAt: Date;
  }

  export class PrismaClient {
    scrapeRun: {
      create: (...args: any[]) => Promise<ScrapeRun>;
      findMany: (...args: any[]) => Promise<ScrapeRun[]>;
    };
    marketplaceControl: {
      findMany: (...args: any[]) => Promise<MarketplaceControl[]>;
      findFirst: (...args: any[]) => Promise<MarketplaceControl | null>;
      findUnique: (...args: any[]) => Promise<MarketplaceControl | null>;
      upsert: (...args: any[]) => Promise<MarketplaceControl>;
    };
  }
}
