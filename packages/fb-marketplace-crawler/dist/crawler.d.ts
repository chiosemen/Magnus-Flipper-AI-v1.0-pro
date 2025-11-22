import { CrawlJob, CrawlResult } from '@magnus-flipper-ai/shared';
export interface CrawlerConfig {
    headless?: boolean;
    timeout?: number;
}
export declare function runCrawler(job: CrawlJob, config?: CrawlerConfig): Promise<CrawlResult>;
//# sourceMappingURL=crawler.d.ts.map