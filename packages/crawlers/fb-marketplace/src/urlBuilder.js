function buildSearchUrl(city, searchParams) {
  const baseUrl = `https://www.facebook.com/marketplace/${city}/search/`;
  const queryParams = new URLSearchParams();

  if (searchParams.query) {
    queryParams.set('query', searchParams.query);
  }
  if (searchParams.minPrice) {
    queryParams.set('minPrice', searchParams.minPrice);
  }
  if (searchParams.maxPrice) {
    queryParams.set('maxPrice', searchParams.maxPrice);
  }
  if (searchParams.itemCondition) {
    queryParams.set('itemCondition', searchParams.itemCondition);
  }
  if (searchParams.radius) {
    queryParams.set('radius', searchParams.radius);
  }
  if (searchParams.postalCode) {
    queryParams.set('postalCode', searchParams.postalCode);
  }
  queryParams.set('exact', 'false');

  return `${baseUrl}?${queryParams.toString()}`;
}

module.exports = { buildSearchUrl };
