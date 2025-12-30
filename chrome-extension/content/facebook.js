// content/facebook.js
function absUrl(url) {
  try { return new URL(url, location.href).toString(); } catch { return url; }
}

function clean(text) {
  return (text || "").replace(/\s+/g, " ").trim();
}

// FB DOM shifts constantly; use resilient heuristics:
// - find anchors that look like marketplace item links
// - walk up to card container and extract nearby text
function extractFacebookMarketplaceListings(limit = 30) {
  const anchors = Array.from(document.querySelectorAll('a[href*="/marketplace/item/"]'))
    .filter(a => a.href && !a.href.includes("ref=")); // mild noise filter

  const seen = new Set();
  const items = [];

  for (const a of anchors) {
    const url = absUrl(a.getAttribute("href") || a.href);
    const m = url.match(/\/marketplace\/item\/(\d+)/);
    const id = m?.[1];
    if (!id || seen.has(id)) continue;
    seen.add(id);

    // card container heuristic: go up a few levels
    let card = a;
    for (let i = 0; i < 6 && card; i++) card = card.parentElement || card;
    const cardText = clean(card?.innerText || a.innerText);

    // Heuristic price: look for currency patterns
    const priceMatch =
      cardText.match(/£\s?[\d,]+/) ||
      cardText.match(/\$\s?[\d,]+/) ||
      cardText.match(/€\s?[\d,]+/);

    // Title heuristic: take first non-price-ish line
    const lines = cardText.split("\n").map(clean).filter(Boolean);
    const title =
      lines.find(l => !l.includes("£") && !l.includes("$") && !l.includes("€")) ||
      lines[0] ||
      "";

    // Image
    const imgEl = a.querySelector("img") || card?.querySelector?.("img");
    const image = imgEl?.getAttribute("src") || "";

    items.push({
      source: "facebook",
      id,
      title,
      priceText: priceMatch?.[0] || "",
      url,
      image
    });

    if (items.length >= limit) break;
  }

  return items;
}

// Listen for popup request
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "SCRAPE_FACEBOOK") {
    const limit = typeof msg.limit === "number" ? msg.limit : 30;
    sendResponse({ items: extractFacebookMarketplaceListings(limit) });
  }
  
  if (msg?.type === "SCRAPE_PAGE_GENERIC") {
    sendResponse({
      marketplace: "facebook",
      items: extractFacebookMarketplaceListings(40)
    });
  }
  
  return true; // Keep channel open for async response
});

