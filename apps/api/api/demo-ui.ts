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
      .search-panel {
        background: var(--panel);
        border: 1px solid var(--border);
        border-radius: 16px;
        padding: 14px 16px;
      }
      .search-form {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
      }
      .search-input {
        flex: 1;
        min-width: 220px;
        padding: 10px 12px;
        border-radius: 10px;
        border: 1px solid var(--border);
        background: #0f1422;
        color: var(--text);
        font-size: 13px;
      }
      .search-input::placeholder { color: var(--muted); }
      .search-input:disabled { opacity: 0.6; cursor: not-allowed; }
      .search-button {
        padding: 10px 16px;
        border-radius: 10px;
        border: none;
        background: var(--accent);
        color: #0b0d12;
        font-weight: 600;
        cursor: pointer;
      }
      .search-button:disabled { opacity: 0.6; cursor: not-allowed; }
      .search-hint {
        margin-top: 8px;
        font-size: 12px;
        color: var(--muted);
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
        margin-top: 8px;
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
      .badge {
        display: inline-block;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        margin-left: 6px;
      }
      .badge.enriched { background: rgba(52, 211, 153, 0.2); color: var(--good); }
      .badge.browser { background: rgba(110, 168, 254, 0.2); color: var(--accent); }
      .badge.cached { background: rgba(251, 191, 36, 0.2); color: var(--warn); }
      .badge.stale { background: rgba(156, 163, 175, 0.2); color: var(--muted); }
      .cache-meta {
        font-size: 11px;
        color: var(--muted);
        margin-top: 4px;
      }
    </style>
  </head>
  <body>
    <header>
      <div class="banner">
        <h1>🚀 Magnus — Live Market Demo</h1>
        <p>Live data | Redis cache | Browser-first</p>
        <div class="banner-meta">
          <div>Requests/sec: <span id="rps">0.00</span></div>
          <div>Location: <span id="location-label">GB</span></div>
          <div>Parallel queries: <span id="query-count">0</span></div>
        </div>
        <div class="replay">Replay URL: <a id="replay-url" href="#"></a></div>
      </div>
      <div class="search-panel">
        <form id="search-form" class="search-form" autocomplete="off">
          <input
            id="search-input"
            class="search-input"
            type="text"
            placeholder="Search (comma-separated, max 10)"
          />
          <select id="marketplace-select" style="padding: 10px 12px; border-radius: 10px; border: 1px solid var(--border); background: #0f1422; color: var(--text); font-size: 13px;">
            <option value="gumtree">Gumtree</option>
            <option value="vinted">Vinted</option>
            <option value="facebook">Facebook</option>
          </select>
          <button id="search-submit" class="search-button" type="submit">Search</button>
        </form>
        <div class="search-hint">Example: iphone, macbook, airpods</div>
        <div class="notice hidden" id="query-note">Max 10 concurrent searches (demo limit)</div>
      </div>
      <div class="controls">
        <div class="meter">
          <div class="meter-label" id="concurrency-label">Concurrency: 0 / ${MAX_CONCURRENCY}</div>
          <div class="meter-track">
            <div class="meter-fill" id="concurrency-fill"></div>
          </div>
        </div>
        <div class="odds-row">
          <div class="odds-card" id="cache-status">Cache: --</div>
          <div class="odds-card" id="strategy-status">Strategy: --</div>
        </div>
      </div>
    </header>
    <main id="results"></main>
    <script>
      (function () {
        const MAX_CONCURRENCY = ${MAX_CONCURRENCY};
        const resultsEl = document.getElementById('results');
        const concurrencyFill = document.getElementById('concurrency-fill');
        const concurrencyLabel = document.getElementById('concurrency-label');
        const rpsEl = document.getElementById('rps');
        const locationLabel = document.getElementById('location-label');
        const queryCountEl = document.getElementById('query-count');
        const replayEl = document.getElementById('replay-url');
        const queryNote = document.getElementById('query-note');
        const searchForm = document.getElementById('search-form');
        const searchInput = document.getElementById('search-input');
        const marketplaceSelect = document.getElementById('marketplace-select');
        const searchButton = document.getElementById('search-submit');
        const cacheStatusEl = document.getElementById('cache-status');
        const strategyStatusEl = document.getElementById('strategy-status');
        const params = new URLSearchParams(window.location.search);
        const rawQuery = params.get('q') || '';
        const marketplace = params.get('marketplace') || 'gumtree';
        const location = params.get('location') || 'GB';
        const initialParsed = parseQueries(rawQuery || 'iphone');
        let activeQueries = initialParsed.queries;
        let resultsByQuery = {};
        let inFlight = 0;
        let completed = 0;
        let startWall = 0;
        let rpsTimer = null;
        let debounceTimer = null;
        let isRunning = false;
        let lastMeta = {};

        function escapeHtml(value) {
          return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
        }

        function parseQueries(value) {
          const parsed = String(value || '')
            .split(',')
            .map((q) => q.trim())
            .filter(Boolean);
          return {
            queries: parsed.slice(0, MAX_CONCURRENCY),
            truncated: parsed.length > MAX_CONCURRENCY,
          };
        }

        function updateQueryNote(truncated) {
          if (truncated) {
            queryNote.textContent = 'Max 10 concurrent searches (demo limit)';
            queryNote.classList.remove('hidden');
            return;
          }
          queryNote.textContent = '';
          queryNote.classList.add('hidden');
        }

        function setInputDisabled(disabled) {
          searchInput.disabled = disabled;
          searchButton.disabled = disabled;
          marketplaceSelect.disabled = disabled;
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

        function updateMeta(meta) {
          lastMeta = meta || {};
          if (meta) {
            const cacheLabel = meta.cacheStatus === 'hit' ? 'Cache: HIT' :
                              meta.cacheStatus === 'miss-filled' ? 'Cache: MISS' :
                              meta.cacheStatus === 'lock-busy' ? 'Cache: BUSY' :
                              'Cache: --';
            cacheStatusEl.textContent = cacheLabel;
            cacheStatusEl.className = 'odds-card' + (meta.cacheStatus === 'hit' ? ' good' : meta.cacheStatus === 'miss-filled' ? ' warn' : '');
            
            strategyStatusEl.textContent = 'Strategy: ' + (meta.strategy || '--').toUpperCase();
            if (meta.ageSeconds !== undefined) {
              cacheStatusEl.textContent += ' (' + meta.ageSeconds + 's old)';
            }
          }
        }

        function buildReplayUrl(queries, marketplace) {
          const nextParams = new URLSearchParams();
          nextParams.set('q', queries.join(','));
          nextParams.set('marketplace', marketplace);
          if (location) nextParams.set('location', location);
          return window.location.origin + '/api/demo-ui?' + nextParams.toString();
        }

        function updateUrl(queries, marketplace) {
          const nextParams = new URLSearchParams(window.location.search);
          nextParams.set('q', queries.join(','));
          nextParams.set('marketplace', marketplace);
          if (location) {
            nextParams.set('location', location);
          } else {
            nextParams.delete('location');
          }
          window.history.replaceState(null, '', '/api/demo-ui?' + nextParams.toString());
        }

        function renderCard(result, source) {
          if (!result) {
            return '<div class="card"><div class="card-title">' +
              escapeHtml(source) +
              '</div><div class="loading">Loading...</div></div>';
          }
          const title = source.toUpperCase();
          const meta = 'Time: ' + result.durationMs + ' ms | Items: ' + result.count;
          const cacheInfo = result.meta ? ' | Cache: ' + result.meta.cacheStatus : '';
          if (result.error) {
            return '<div class="card">' +
              '<div class="card-title">' + escapeHtml(title) + '</div>' +
              '<div class="meta">' + escapeHtml(meta) + '</div>' +
              '<div class="error">' + escapeHtml(result.error) + '</div>' +
              '</div>';
          }
          const items = (result.items || []).slice(0, 3).map((item) => {
            const itemTitle = item.title || 'Item';
            const link = item.url || '';
            const safeLink = link && link.startsWith('http') ? link : '';
            const badge = item.badge ? '<span class="badge ' + escapeHtml(item.badge) + '">' + escapeHtml(item.badge) + '</span>' : '';
            const freshness = item.freshnessSeconds !== undefined ? ' (' + item.freshnessSeconds + 's)' : '';
            const content = safeLink
              ? '<a href="' + escapeHtml(safeLink) + '" target="_blank" rel="noopener noreferrer">' +
                escapeHtml(itemTitle) + '</a>' + badge + freshness
              : escapeHtml(itemTitle) + badge + freshness;
            return '<div class="item">' + content + '</div>';
          }).join('');
          return '<div class="card">' +
            '<div class="card-title">' + escapeHtml(title) + '</div>' +
            '<div class="meta">' + escapeHtml(meta + cacheInfo) + '</div>' +
            items +
            '</div>';
        }

        function renderResults() {
          const blocks = activeQueries.map((query) => {
            const group = resultsByQuery[query] || {};
            const header = '<div class="query-header">' +
              '<div class="query-title">Query: ' + escapeHtml(query) + '</div>' +
              '<div class="meta">Marketplace: ' + escapeHtml(marketplaceSelect.value) + '</div>' +
              '</div>';
            const grid = '<div class="market-grid">' +
              renderCard(group.result, marketplaceSelect.value) +
              '</div>';
            return '<section class="query-section">' + header + grid + '</section>';
          }).join('');
          resultsEl.innerHTML = blocks;
        }

        async function runSearch(query) {
          const startedAt = Date.now();
          const currentMarketplace = marketplaceSelect.value;
          const url = new URL('/api/demo', window.location.origin);
          url.searchParams.set('q', query);
          url.searchParams.set('marketplace', currentMarketplace);
          url.searchParams.set('country', location);
          url.searchParams.set('mode', 'search');
          try {
            const response = await fetch(url.toString());
            const json = await response.json();
            const items = Array.isArray(json && json.items) ? json.items : [];
            const durationMs = Date.now() - startedAt;
            const ok = response.ok && items.length > 0;
            updateMeta(json.meta);
            return {
              query,
              durationMs,
              count: items.length,
              items,
              meta: json.meta,
              error: response.ok
                ? (items.length ? '' : 'Empty results')
                : (json && json.error ? String(json.error) : 'Request failed (' + response.status + ')'),
            };
          } catch (error) {
            return {
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
                      resultsByQuery[result.query].result = result;
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

        function applyQueries(nextQueries, truncated, updateHistory) {
          activeQueries = nextQueries;
          queryCountEl.textContent = String(activeQueries.length);
          updateQueryNote(truncated);
          if (updateHistory) {
            updateUrl(activeQueries, marketplaceSelect.value);
          }
          const replayUrl = buildReplayUrl(activeQueries, marketplaceSelect.value);
          replayEl.textContent = replayUrl;
          replayEl.href = replayUrl;
          resultsByQuery = {};
          activeQueries.forEach((query) => {
            resultsByQuery[query] = { result: null };
          });
          renderResults();
        }

        function startSearch(nextQueries, truncated, updateHistory) {
          if (!nextQueries.length || isRunning) return;
          if (debounceTimer) {
            clearTimeout(debounceTimer);
            debounceTimer = null;
          }
          isRunning = true;
          setInputDisabled(true);
          applyQueries(nextQueries, truncated, updateHistory);
          inFlight = 0;
          updateConcurrency();
          startRpsTimer();

          const tasks = [];
          nextQueries.forEach((query) => {
            tasks.push(() => runSearch(query));
          });

          runPool(tasks, MAX_CONCURRENCY).then(() => {
            stopRpsTimer();
            isRunning = false;
            setInputDisabled(false);
          });
        }

        function triggerSearch(value) {
          const trimmed = String(value || '').trim();
          if (!trimmed) return;
          const parsed = parseQueries(trimmed);
          updateQueryNote(parsed.truncated);
          if (!parsed.queries.length) return;
          searchInput.value = parsed.queries.join(', ');
          startSearch(parsed.queries, parsed.truncated, true);
        }

        function scheduleDebounce() {
          if (isRunning) return;
          const currentValue = searchInput.value;
          const parsed = parseQueries(currentValue);
          updateQueryNote(parsed.truncated);
          if (!currentValue.trim()) {
            if (debounceTimer) {
              clearTimeout(debounceTimer);
              debounceTimer = null;
            }
            return;
          }
          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = window.setTimeout(() => {
            if (!isRunning) {
              triggerSearch(searchInput.value);
            }
          }, 500);
        }

        locationLabel.textContent = location;
        marketplaceSelect.value = marketplace;
        searchInput.value = initialParsed.truncated
          ? initialParsed.queries.join(', ')
          : (rawQuery || initialParsed.queries.join(', '));

        searchForm.addEventListener('submit', (event) => {
          event.preventDefault();
          if (isRunning) return;
          triggerSearch(searchInput.value);
        });

        searchInput.addEventListener('input', scheduleDebounce);

        startSearch(activeQueries, initialParsed.truncated, false);
      })();
    </script>
  </body>
</html>`;

  res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
}

