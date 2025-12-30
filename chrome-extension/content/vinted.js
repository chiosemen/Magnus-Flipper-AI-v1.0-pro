// content/vinted.js
function clean(text) {
  return (text || "").replace(/\s+/g, " ").trim();
}
function absUrl(url) {
  try { return new URL(url, location.href).toString(); } catch { return url; }
}

function extractVintedListings(limit = 40) {
  // Vinted cards usually contain anchors to /items/<id>
  const anchors = Array.from(document.querySelectorAll('a[href*="/items/"]'));
  const seen = new Set();
  const items = [];

  for (const a of anchors) {
    const href = a.getAttribute("href");
    if (!href) continue;
    const url = absUrl(href);
    const m = url.match(/\/items\/(\d+)/);
    const id = m?.[1];
    if (!id || seen.has(id)) continue;
    seen.add(id);

    // Try read card container text
    const card = a.closest("article") || a.parentElement;
    const text = clean(card?.innerText || a.innerText);
    const priceMatch = text.match(/€\s?[\d,.]+/) || text.match(/£\s?[\d,.]+/) || text.match(/\$\s?[\d,.]+/);

    // Title heuristic: first line that isn't price
    const lines = (card?.innerText || "").split("\n").map(clean).filter(Boolean);
    const title = lines.find(l => !l.includes("€") && !l.includes("£") && !l.includes("$")) || lines[0] || "";

    const img = card?.querySelector("img")?.getAttribute("src") || "";

    items.push({
      source: "vinted",
      id,
      title,
      priceText: priceMatch?.[0] || "",
      url,
      image: img
    });

    if (items.length >= limit) break;
  }

  return items;
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "SCRAPE_VINTED") {
    const limit = typeof msg.limit === "number" ? msg.limit : 40;
    sendResponse({ items: extractVintedListings(limit) });
  }
  
  if (msg?.type === "SCRAPE_PAGE_GENERIC") {
    sendResponse({
      marketplace: "vinted",
      items: extractVintedListings(40)
    });
  }
  
  return true; // Keep channel open for async response
});

