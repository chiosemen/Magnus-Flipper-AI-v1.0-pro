export function normalizeQuery(query: string): string {
  return query.trim().replace(/\s+/g, "-").toLowerCase();
}

export function buildSearchUrl(query: string): string {
  const normalized = normalizeQuery(query);
  return `https://www.gumtree.com/search?search_category=all&q=${normalized}`;
}
