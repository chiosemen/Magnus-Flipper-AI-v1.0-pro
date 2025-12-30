// background.js
const API_BASE = "https://magnus-api.vercel.app";

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
  if (msg.type === "ENRICH_ITEMS") {
    try {
      const response = await fetch(`${API_BASE}/api/demo?mode=enrich`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: msg.items }),
      });
      const data = await response.json();
      sendResponse(data);
    } catch (error) {
      sendResponse({ error: error.message || "Failed to enrich items" });
    }
    return true; // Keep channel open for async response
  }

  if (msg.type === "INGEST_ITEMS") {
    try {
      const response = await fetch(`${API_BASE}/api/ingest/browser`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marketplace: msg.marketplace,
          country: msg.country || "GB",
          query: msg.query || "",
          items: msg.items,
        }),
      });
      const data = await response.json();
      sendResponse(data);
    } catch (error) {
      sendResponse({ error: error.message || "Failed to ingest items" });
    }
    return true; // Keep channel open for async response
  }
});

// Listen for tab updates to auto-extract when on marketplace pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    if (tab.url.includes("facebook.com/marketplace") || tab.url.includes("vinted.co.uk") || tab.url.includes("vinted.com")) {
      // Optionally trigger extraction automatically
      // For now, we'll rely on manual trigger via popup
    }
  }
});

