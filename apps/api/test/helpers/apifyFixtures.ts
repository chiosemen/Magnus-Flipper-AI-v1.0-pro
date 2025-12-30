/**
 * Build sample marketplace items for testing
 */
export function buildMarketplaceItems(marketplace: 'gumtree' | 'vinted' | 'facebook', count = 5) {
  const items = [];
  for (let i = 0; i < count; i++) {
    items.push({
      source: marketplace,
      title: `${marketplace} Item ${i + 1}`,
      priceText: `£${(100 + i * 50).toFixed(2)}`,
      url: `https://www.${marketplace}.com/items/${i + 1}`,
      image: `https://example.com/image-${i + 1}.jpg`,
      ...(marketplace === 'gumtree' && {
        location: 'London',
        currency: 'GBP',
      }),
    });
  }
  return items;
}

/**
 * Build Apify actor response format
 */
export function buildApifyResponse(marketplace: 'gumtree' | 'vinted' | 'facebook', count = 5) {
  return buildMarketplaceItems(marketplace, count).map((item) => ({
    title: item.title,
    price: item.priceText.replace('£', '').replace(',', ''),
    priceText: item.priceText,
    url: item.url,
    image: item.image,
    ...(marketplace === 'gumtree' && {
      location: item.location,
      currency: 'GBP',
    }),
  }));
}

