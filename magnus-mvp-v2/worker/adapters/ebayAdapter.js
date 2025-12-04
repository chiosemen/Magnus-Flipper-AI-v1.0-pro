import axios from "axios";

const EBAY_API_KEY = process.env.EBAY_API_KEY;
const EBAY_ENDPOINT =
  process.env.EBAY_API_ENDPOINT || "https://api.example-ebay-proxy.com/search";

export async function ebayAdapter({ query, limit = 10 }) {
  if (!EBAY_API_KEY) {
    console.warn("No EBAY_API_KEY configured, skipping eBay results.");
    return [];
  }

  const response = await axios.get(EBAY_ENDPOINT, {
    params: { q: query, limit },
    headers: {
      Authorization: `Bearer ${EBAY_API_KEY}`
    },
    timeout: 10000
  });

  const items = response.data.items || [];

  return items.map((item) => ({
    marketplace: "ebay",
    id: item.id,
    title: item.title,
    price: item.price,
    currency: item.currency || "USD",
    url: item.url,
    thumbnail: item.thumbnail,
    scrapedAt: new Date().toISOString()
  }));
}
