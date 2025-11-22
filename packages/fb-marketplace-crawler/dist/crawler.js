"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCrawler = runCrawler;
const puppeteer_1 = __importDefault(require("puppeteer"));
async function runCrawler(job, config = {}) {
    const { headless = true, timeout = 30000 } = config;
    try {
        const browser = await puppeteer_1.default.launch({
            headless,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 720 });
        // Navigate to Facebook Marketplace
        await page.goto(job.url, { waitUntil: 'networkidle2', timeout });
        // TODO: Implement actual scraping logic
        // This is a minimal stub for Phase 1
        const items = [];
        await browser.close();
        return {
            jobId: job.id,
            items,
            crawledAt: new Date(),
            success: true,
        };
    }
    catch (error) {
        return {
            jobId: job.id,
            items: [],
            crawledAt: new Date(),
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
//# sourceMappingURL=crawler.js.map