// popup.js
const API_BASE = "https://magnus-api.vercel.app";

document.getElementById("send").onclick = async () => {
  const status = document.getElementById("status");
  status.textContent = "Collecting listings…";
  status.className = "status info";

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Ask content script to scrape current page
    const resp = await chrome.tabs.sendMessage(tab.id, {
      type: "SCRAPE_PAGE_GENERIC"
    });

    if (!resp?.items?.length) {
      status.textContent = "No listings found on this page.";
      status.className = "status error";
      return;
    }

    const query =
      document.getElementById("query").value ||
      "manual_seed_" + Date.now();

    status.textContent = "Uploading…";

    const r = await fetch(`${API_BASE}/api/ingest/browser`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        marketplace: resp.marketplace,
        country: "GB",
        query,
        items: resp.items
      })
    });

    const out = await r.json();

    if (out.ok) {
      status.textContent = "✅ Sent. Dashboard updated.";
      status.className = "status success";
    } else {
      status.textContent = "⚠️ Upload failed.";
      status.className = "status error";
    }
  } catch (error) {
    status.textContent = `Error: ${error.message}`;
    status.className = "status error";
  }
};

