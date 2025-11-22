import puppeteer from 'puppeteer';
import { CrawlJob, CrawlResult, MarketplaceItem } from '@magnus-flipper-ai/shared';

export interface CrawlerConfig {
  headless?: boolean;
  timeout?: number;
}

export async function runCrawler(
  job: CrawlJob,
  config: CrawlerConfig = {}
): Promise<CrawlResult> {
  const { headless = true, timeout = 30000 } = config;

  try {
    const browser = await puppeteer.launch({
      headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    // Navigate to Facebook Marketplace
    await page.goto(job.url, { waitUntil: 'networkidle2', timeout });

    // TODO: Implement actual scraping logic
    // This is a minimal stub for Phase 1
    const items: MarketplaceItem[] = [];

    await browser.close();

    return {
      jobId: job.id,
      items,
      crawledAt: new Date(),
      success: true,
    };
  } catch (error) {
    return {
      jobId: job.id,
      items: [],
      crawledAt: new Date(),
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
