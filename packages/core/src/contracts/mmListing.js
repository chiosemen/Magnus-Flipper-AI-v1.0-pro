/**
 * MM Listing Contract
 * Normalized listing format for MM-Agent UI
 */
/**
 * Normalize Facebook Marketplace listing to MM contract
 */
export function normalizeFacebookListing(raw, geo) {
    const currency = geo === "US" ? "USD" : "GBP";
    // Parse price - handle various formats
    let price = null;
    if (raw.price !== undefined && raw.price !== null) {
        if (typeof raw.price === "number") {
            price = raw.price;
        }
        else if (typeof raw.price === "string") {
            // Remove currency symbols and parse
            const cleaned = raw.price.replace(/[^\d.,]/g, "").replace(/,/g, "");
            const parsed = parseFloat(cleaned);
            if (!isNaN(parsed)) {
                price = parsed;
            }
        }
    }
    return {
        id: raw.id || raw.link || `fb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: raw.title || "Untitled",
        price,
        currency,
        location: raw.location || geo,
        marketplace: "facebook",
        url: raw.link || raw.url || "",
        imageUrl: Array.isArray(raw.images) && raw.images.length > 0 ? raw.images[0] : raw.imageUrl,
        sellerName: raw.seller_name || raw.sellerName,
        scrapedAt: new Date().toISOString(),
    };
}
//# sourceMappingURL=mmListing.js.map