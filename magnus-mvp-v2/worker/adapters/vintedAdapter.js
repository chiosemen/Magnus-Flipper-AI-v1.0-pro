import axios from "axios";

const VINTED_API_KEY = process.env.VINTED_API_KEY;
const VINTED_ENDPOINT =
  process.env.VINTED_API_ENDPOINT || "https://api.example-vinted-proxy.com/search";

export async function vintedAdapter({ query, limit = 10 }) {
  if (!VINTED_API_KEY) {
    console.warn("No VINTED_API_KEY configured, skipping Vinted results.");
    return [];
  }

  const response = await axios.get(VINTED_ENDPOINT, {
    params: { q: query, limit },
    headers: {
      Authorization: `Bearer ${VINTED_API_KEY}`
    },
    timeout: 10000
  });

  const items = response.data.items || [];

  return items.map((item) => ({
    marketplace: "vinted",
    id: item.id,
    title: item.title,
    price: item.price,
    currency: item.currency || "EUR",
    url: item.url,
    thumbnail: item.thumbnail,
    scrapedAt: new Date().toISOString()
  }));
}
