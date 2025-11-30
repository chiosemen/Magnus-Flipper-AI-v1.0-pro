export function normalizeQuery(query: string): string {
  return query.trim().replace(/\s+/g, "+");
}

export function buildSearchUrl(query: string): string {
  const normalized = normalizeQuery(query);
  return `https://www.ebay.com/sch/i.html?_nkw=${normalized}`;
}
