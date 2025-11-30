import axios from "axios";

const GUMTREE_API_KEY = process.env.GUMTREE_API_KEY;
const GUMTREE_ENDPOINT =
  process.env.GUMTREE_API_ENDPOINT || "https://api.example-gumtree-proxy.com/search";

export async function gumtreeAdapter({ query, limit = 10 }) {
  if (!GUMTREE_API_KEY) {
    console.warn("No GUMTREE_API_KEY configured, skipping Gumtree results.");
    return [];
  }

  const response = await axios.get(GUMTREE_ENDPOINT, {
    params: { q: query, limit },
    headers: {
      Authorization: `Bearer ${GUMTREE_API_KEY}`
    },
    timeout: 10000
  });

  const items = response.data.items || [];

  return items.map((item) => ({
    marketplace: "gumtree",
    id: item.id,
    title: item.title,
    price: item.price,
    currency: item.currency || "GBP",
    url: item.url,
    thumbnail: item.thumbnail,
    scrapedAt: new Date().toISOString()
  }));
}
