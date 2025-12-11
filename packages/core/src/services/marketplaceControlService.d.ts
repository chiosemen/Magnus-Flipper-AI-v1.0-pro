export interface MarketplaceControlDTO {
    marketplace: string;
    enabled: boolean;
    maxConcurrency: number;
}
export declare function getAllMarketplaceControls(): Promise<MarketplaceControlDTO[]>;
export declare function upsertMarketplaceControl(input: MarketplaceControlDTO): Promise<MarketplaceControlDTO>;
export declare function getMarketplaceEffectiveControl(marketplace: string): Promise<MarketplaceControlDTO>;
//# sourceMappingURL=marketplaceControlService.d.ts.map