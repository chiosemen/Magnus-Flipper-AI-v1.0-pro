export interface CrawlJob {
    id: string;
    url: string;
    marketplace: 'facebook' | 'craigslist' | 'offerup';
    searchQuery: string;
    filters?: Record<string, any>;
    createdAt: Date;
}
export interface CrawlResult {
    jobId: string;
    items: MarketplaceItem[];
    crawledAt: Date;
    success: boolean;
    error?: string;
}
export interface MarketplaceItem {
    id: string;
    title: string;
    price: number;
    currency: string;
    location: string;
    description: string;
    imageUrls: string[];
    url: string;
    postedAt: Date;
    marketplace: string;
}
export interface AnalysisJob {
    id: string;
    itemId: string;
    analysisType: 'profit' | 'authenticity' | 'trend';
    createdAt: Date;
}
export interface AnalysisResult {
    jobId: string;
    itemId: string;
    score: number;
    insights: Record<string, any>;
    analyzedAt: Date;
}
export interface AlertJob {
    id: string;
    userId: string;
    itemId: string;
    alertType: 'price_drop' | 'new_listing' | 'profit_opportunity';
    createdAt: Date;
}
export interface NotificationPayload {
    userId: string;
    channel: 'telegram' | 'email' | 'push';
    subject: string;
    message: string;
    metadata?: Record<string, any>;
}
//# sourceMappingURL=types.d.ts.map