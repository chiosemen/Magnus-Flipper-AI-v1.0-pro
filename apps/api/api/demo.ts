import type { VercelRequest, VercelResponse } from '@vercel/node';

const MAX_CONCURRENCY = 10;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method && req.method !== 'GET') {
    res.status(405).send('Method not allowed');
    return;
  }

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Magnus — Live Market Demo</title>
    <style>
      :root {
        color-scheme: dark;
        --bg: #0b0d12;
        --panel: #141924;
        --panel-soft: #1b2332;
        --text: #f4f6fb;
        --muted: #9aa3b2;
        --accent: #6ea8fe;
        --border: rgba(255, 255, 255, 0.08);
        --good: #34d399;
        --warn: #fbbf24;
        --bad: #f87171;
        --shadow: 0 18px 40px rgba(0, 0, 0, 0.3);
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
        background: radial-gradient(circle at top, #1a2030 0%, var(--bg) 45%);
        color: var(--text);
        padding: 28px 20px 60px;
      }
      header {
        max-width: 1120px;
        margin: 0 auto 24px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .banner {
        background: linear-gradient(120deg, rgba(110, 168, 254, 0.16), rgba(20, 25, 36, 0.9));
        border: 1px solid var(--border);
        border-radius: 16px;
        padding: 18px 20px;
        box-shadow: var(--shadow);
      }
      .banner h1 {
        margin: 0 0 6px;
        font-size: 24px;
        letter-spacing: 0.3px;
      }
      .banner p {
        margin: 0;
        color: var(--muted);
        font-size: 13px;
      }
      .banner-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 12px 18px;
        margin-top: 10px;
        font-size: 13px;
        color: var(--muted);
      }
      .replay {
        margin-top: 10px;
        font-size: 12px;
      }
      .replay a {
        color: var(--accent);
        text-decoration: none;
        word-break: break-all;
      }
      .controls {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 14px;
      }
      .meter,
      .odds-card,
      .toggle,
      .notice,
      .proxy-banner {
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 14px;
        padding: 14px 16px;
      }
      .meter-label {
        font-size: 13px;
        color: var(--muted);
        margin-bottom: 8px;
      }
      .meter-track {
        height: 10px;
        border-radius: 999px;
        background: #111622;
        overflow: hidden;
      }
      .meter-fill {
        height: 100%;
        width: 0%;
        background: linear-gradient(90deg, #6ea8fe 0%, #60a5fa 100%);
        transition: width 200ms ease;
      }
      .odds-row {
        display: grid;
        gap: 10px;
      }
      .odds-card {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 13px;
        color: var(--muted);
      }
      .odds-card.good { border-color: rgba(52, 211, 153, 0.4); color: var(--good); }
      .odds-card.warn { border-color: rgba(251, 191, 36, 0.4); color: var(--warn); }
      .odds-card.bad { border-color: rgba(248, 113, 113, 0.4); color: var(--bad); }
      .toggle {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 13px;
        color: var(--muted);
      }
      .toggle input {
        width: 16px;
        height: 16px;
        accent-color: var(--accent);
      }
      .proxy-banner {
        border-color: rgba(110, 168, 254, 0.35);
        color: var(--accent);
        font-size: 13px;
      }
      .notice {
        color: var(--muted);
        font-size: 12px;
      }
      .hidden { display: none; }
      main {
        max-width: 1120px;
        margin: 0 auto;
        display: flex;
        flex-direction: column;
        gap: 18px;
      }
      .query-section {
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 16px;
        padding: 16px 18px 20px;
        box-shadow: var(--shadow);
      }
      .query-header {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        gap: 8px;
        margin-bottom: 12px;
        font-size: 14px;
      }
      .query-title {
        font-weight: 600;
      }
      .market-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 12px;
      }
      .card {
        background: var(--panel-soft);
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 12px 14px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-height: 120px;
      }
      .card-title {
        font-weight: 600;
        font-size: 13px;
        letter-spacing: 0.3px;
        text-transform: uppercase;
        color: var(--accent);
      }
      .meta {
        font-size: 12px;
        color: var(--muted);
      }
      .item {
        font-size: 12px;
        border-top: 1px solid var(--border);
        padding-top: 6px;
        color: var(--text);
      }
      .item a {
        color: var(--text);
        text-decoration: none;
      }
      .item a:hover { color: var(--accent); }
      .error {
        color: var(--bad);
        font-size: 12px;
        font-weight: 600;
      }
      .loading {
        color: var(--muted);
        font-size: 12px;
      }
    </style>
  </head>
  <body>
    <header>
      <div class="banner">
        <h1>🚀 Magnus — 10-Market Live Test</h1>
        <p>Live data | No cache | No mocks</p>
        <div class="banner-meta">
          <div>Requests/sec: <span id="rps">0.00</span></div>
          <div>Location: <span id="location-label">prague</span></div>
          <div>Parallel queries: <span id="query-count">0</span></div>
        </div>
        <div class="replay">Replay URL: <a id="replay-url" href="#"></a></div>
      </div>
      <div class="controls">
        <div class="meter">
          <div class="meter-label" id="concurrency-label">Concurrency: 0 / ${MAX_CONCURRENCY}</div>
          <div class="meter-track">
            <div class="meter-fill" id="concurrency-fill"></div>
          </div>
        </div>
        <div class="odds-row">
          <div class="odds-card" id="facebook-odds">Facebook success: --%</div>
          <div class="odds-card" id="vinted-odds">Vinted success: --%</div>
        </div>
        <label class="toggle">
          <input type="checkbox" id="proxy-toggle" />
          <span>🇬🇧 UK Proxy Mode</span>
        </label>
        <div class="proxy-banner hidden" id="proxy-banner">UK Residential Proxy Mode (Demo)</div>
        <div class="notice hidden" id="query-note"></div>
      </div>
    </header>
    <main id="results"></main>
    <script>
      (function () {
        const MAX_CONCURRENCY = ${MAX_CONCURRENCY};
        const sources = ['facebook', 'vinted'];
        const resultsEl = document.getElementById('results');
        const concurrencyFill = document.getElementById('concurrency-fill');
        const concurrencyLabel = document.getElementById('concurrency-label');
        const rpsEl = document.getElementById('rps');
        const locationLabel = document.getElementById('location-label');
        const queryCountEl = document.getElementById('query-count');
        const replayEl = document.getElementById('replay-url');
        const proxyToggle = document.getElementById('proxy-toggle');
        const proxyBanner = document.getElementById('proxy-banner');
        const facebookOdds = document.getElementById('facebook-odds');
        const vintedOdds = document.getElementById('vinted-odds');
        const queryNote = document.getElementById('query-note');
        const params = new URLSearchParams(window.location.search);
        const rawQuery = params.get('q') || 'iphone';
        const location = params.get('location') || 'prague';
        const proxyOn = params.get('proxy') === 'uk';
        const allQueries = rawQuery
          .split(',')
          .map((q) => q.trim())
          .filter(Boolean);
        const queries = (allQueries.length ? allQueries : ['iphone']).slice(0, MAX_CONCURRENCY);
        const truncated = allQueries.length > MAX_CONCURRENCY;
        const resultsByQuery = {};
        let inFlight = 0;
        let completed = 0;
        let startWall = 0;
        let rpsTimer = null;
        const stats = {
          facebook: { attempted: 0, success: 0, failed: 0 },
          vinted: { attempted: 0, success: 0, failed: 0 },
        };

        function escapeHtml(value) {
          return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\"/g, '&quot;')
            .replace(/'/g, '&#39;');
        }

        function pickField(item, keys) {
          for (const key of keys) {
            const value = key.split('.').reduce((acc, part) => {
              if (!acc || typeof acc !== 'object') return undefined;
              return acc[part];
            }, item);
            if (typeof value === 'string' && value.trim()) return value.trim();
            if (typeof value === 'number') return String(value);
          }
          return '';
        }

        function updateConcurrency() {
          const ratio = Math.min(inFlight, MAX_CONCURRENCY) / MAX_CONCURRENCY;
          concurrencyFill.style.width = Math.round(ratio * 100) + '%';
          concurrencyLabel.textContent = 'Concurrency: ' + inFlight + ' / ' + MAX_CONCURRENCY;
        }

        function updateRps() {
          const elapsed = (Date.now() - startWall) / 1000;
          const rps = elapsed > 0 ? completed / elapsed : 0;
          rpsEl.textContent = rps.toFixed(2);
        }

        function oddsClass(pct) {
          if (pct > 70) return 'good';
          if (pct >= 40) return 'warn';
          return 'bad';
        }

        function updateOdds() {
          ['facebook', 'vinted'].forEach((source) => {
            const attempted = stats[source].attempted;
            const success = stats[source].success;
            const pct = attempted ? (success / attempted) * 100 : 0;
            const label =
              source.charAt(0).toUpperCase() + source.slice(1) + ' success: ' +
              (attempted ? pct.toFixed(0) + '%' : '--%');
            const target = source === 'facebook' ? facebookOdds : vintedOdds;
            target.textContent = label + (proxyOn && attempted && pct < 40 ? ' (proxy limited)' : '');
            target.className = 'odds-card' + (attempted ? ' ' + oddsClass(pct) : '');
          });
        }

        function buildReplayUrl() {
          const nextParams = new URLSearchParams();
          nextParams.set('q', queries.join(','));
          if (location) nextParams.set('location', location);
          if (proxyOn) nextParams.set('proxy', 'uk');
          return window.location.origin + '/api/demo?' + nextParams.toString();
        }

        function renderCard(result, source) {
          if (!result) {
            return '<div class="card"><div class="card-title">' +
              escapeHtml(source) +
              '</div><div class="loading">Loading...</div></div>';
          }
          const title = source.toUpperCase();
          const meta = 'Time: ' + result.durationMs + ' ms | Items: ' + result.count;
          if (result.error) {
            return '<div class="card">' +
              '<div class="card-title">' + escapeHtml(title) + '</div>' +
              '<div class="meta">' + escapeHtml(meta) + '</div>' +
              '<div class="error">' + escapeHtml(result.error) + '</div>' +
              '</div>';
          }
          const items = (result.items || []).slice(0, 3).map((item) => {
            const itemTitle = pickField(item, [
              'title',
              'name',
              'listingTitle',
              'heading',
              'marketplace_listing_title',
            ]) || 'Item';
            const link = pickField(item, [
              'url',
              'listingUrl',
              'itemUrl',
              'link',
              'productUrl',
              'permalink',
            ]);
            const safeLink = link && link.startsWith('http') ? link : '';
            const content = safeLink
              ? '<a href="' + escapeHtml(safeLink) + '" target="_blank" rel="noopener noreferrer">' +
                escapeHtml(itemTitle) + '</a>'
              : escapeHtml(itemTitle);
            return '<div class="item">' + content + '</div>';
          }).join('');
          return '<div class="card">' +
            '<div class="card-title">' + escapeHtml(title) + '</div>' +
            '<div class="meta">' + escapeHtml(meta) + '</div>' +
            items +
            '</div>';
        }

        function renderResults() {
          const blocks = queries.map((query) => {
            const group = resultsByQuery[query] || {};
            const header = '<div class="query-header">' +
              '<div class="query-title">Query: ' + escapeHtml(query) + '</div>' +
              '<div class="meta">Sources: Facebook + Vinted</div>' +
              '</div>';
            const grid = '<div class="market-grid">' +
              renderCard(group.facebook, 'facebook') +
              renderCard(group.vinted, 'vinted') +
              '</div>';
            return '<section class="query-section">' + header + grid + '</section>';
          }).join('');
          resultsEl.innerHTML = blocks;
        }

        async function runSearch(source, query) {
          stats[source].attempted += 1;
          updateOdds();
          const startedAt = Date.now();
          const url = new URL('/api/search', window.location.origin);
          url.searchParams.set('source', source);
          url.searchParams.set('q', query);
          if (location) url.searchParams.set('location', location);
          if (proxyOn) url.searchParams.set('proxy', 'uk');
          try {
            const response = await fetch(url.toString());
            const json = await response.json();
            const items = Array.isArray(json && json.items) ? json.items : [];
            const durationMs = Date.now() - startedAt;
            const ok = response.ok && items.length > 0;
            if (ok) {
              stats[source].success += 1;
            } else {
              stats[source].failed += 1;
            }
            updateOdds();
            const errorMessage = response.ok
              ? (items.length ? '' : 'Empty results')
              : (json && json.error ? String(json.error) : 'Request failed (' + response.status + ')');
            return {
              source,
              query,
              durationMs,
              count: items.length,
              items,
              error: errorMessage,
            };
          } catch (error) {
            stats[source].failed += 1;
            updateOdds();
            return {
              source,
              query,
              durationMs: Date.now() - startedAt,
              count: 0,
              items: [],
              error: error && error.message ? error.message : 'Request failed',
            };
          } finally {
            completed += 1;
            updateRps();
          }
        }

        function runPool(tasks, limit) {
          return new Promise((resolve) => {
            let index = 0;
            const launchNext = () => {
              while (inFlight < limit && index < tasks.length) {
                const task = tasks[index++];
                inFlight += 1;
                updateConcurrency();
                task()
                  .then((result) => {
                    if (result && resultsByQuery[result.query]) {
                      resultsByQuery[result.query][result.source] = result;
                      renderResults();
                    }
                  })
                  .catch(() => {})
                  .finally(() => {
                    inFlight -= 1;
                    updateConcurrency();
                    if (index >= tasks.length && inFlight === 0) {
                      resolve();
                    } else {
                      launchNext();
                    }
                  });
              }
            };
            launchNext();
          });
        }

        function startRpsTimer() {
          startWall = Date.now();
          completed = 0;
          updateRps();
          if (rpsTimer) clearInterval(rpsTimer);
          rpsTimer = window.setInterval(updateRps, 250);
        }

        function stopRpsTimer() {
          if (rpsTimer) {
            clearInterval(rpsTimer);
            rpsTimer = null;
          }
          updateRps();
        }

        function resetStats() {
          stats.facebook = { attempted: 0, success: 0, failed: 0 };
          stats.vinted = { attempted: 0, success: 0, failed: 0 };
          updateOdds();
        }

        locationLabel.textContent = location;
        queryCountEl.textContent = String(queries.length);
        replayEl.textContent = buildReplayUrl();
        replayEl.href = buildReplayUrl();
        proxyToggle.checked = proxyOn;
        proxyBanner.classList.toggle('hidden', !proxyOn);
        if (truncated) {
          queryNote.textContent = 'Showing first ' + MAX_CONCURRENCY + ' queries (hard cap).';
          queryNote.classList.remove('hidden');
        }

        proxyToggle.addEventListener('change', () => {
          const nextParams = new URLSearchParams(window.location.search);
          if (proxyToggle.checked) {
            nextParams.set('proxy', 'uk');
          } else {
            nextParams.delete('proxy');
          }
          if (!nextParams.get('q')) {
            nextParams.set('q', queries.join(','));
          }
          if (location) {
            nextParams.set('location', location);
          }
          window.location.search = nextParams.toString();
        });

        queries.forEach((query) => {
          resultsByQuery[query] = { facebook: null, vinted: null };
        });
        renderResults();
        resetStats();
        updateConcurrency();
        startRpsTimer();

        const tasks = [];
        queries.forEach((query) => {
          sources.forEach((source) => {
            tasks.push(() => runSearch(source, query));
          });
        });

        runPool(tasks, MAX_CONCURRENCY).then(stopRpsTimer);
      })();
    </script>
  </body>
</html>`;

  res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
}
