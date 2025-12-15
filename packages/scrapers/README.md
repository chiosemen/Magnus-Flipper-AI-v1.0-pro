# Scrapers Package

Hybrid scrapers for marketplace data extraction.

## Facebook Scraper

Hybrid approach: HTML-first, Playwright fallback.

```typescript
import { scrapeFacebookHybrid } from "@magnus-flipper-ai/scrapers/facebook";

const result = await scrapeFacebookHybrid({
  query: "iphone 16",
  region: "UK",
  page: 1,
});

// Returns: { source: "html" | "playwright", listings: [...] }
```

## Strategy

1. Try HTML scraper (fast, cheap)
2. Check confidence and listing count
3. If insufficient → escalate to Playwright (slow, reliable)
