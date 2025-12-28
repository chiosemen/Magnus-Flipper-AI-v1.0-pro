# Marketplace Scraper (Facebook + Vinted)

Single Apify Actor that runs Facebook Marketplace and Vinted searches in parallel and writes all results to the default dataset.

## Input

```json
{
  "facebookQueries": [
    { "query": "iphone 14", "location": "London", "maxItems": 50 }
  ],
  "vintedQueries": [
    { "query": "nike tech fleece", "country": "GB", "maxItems": 50 }
  ],
  "maxConcurrencyPerMarketplace": 10
}
```

## Output (per item)

```json
{
  "marketplace": "facebook",
  "query": "iphone 14",
  "title": "iPhone 14 Pro",
  "price": "£499",
  "location": "London",
  "url": "https://m.facebook.com/marketplace/item/...",
  "image": "https://..."
}
```

Vinted items include `brand` and `size` where available.

## Run in Apify Console

1. Create a new Actor.
2. Upload this folder (`apify/marketplace-actor`) as the source.
3. Set the input using the JSON above.
4. Start the run and monitor the default dataset.

Notes:
- Facebook uses the mobile marketplace endpoint and may return fewer items depending on availability.
- Vinted uses the public catalog API for the selected country domain.
