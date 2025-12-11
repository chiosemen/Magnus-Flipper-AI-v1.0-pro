# 🚦 Magnus Real-Time Canary Monitor Dashboard

A live, streaming dashboard that visualizes canary metrics, logs, revisions, and ML decisions — updated entirely by GitHub Actions & GitHub Pages.

## 🌐 Access

Once published, the dashboard is available at:
```
https://[your-org].github.io/[your-repo]/
```

## 📊 What It Shows

### 🔵 Canary Revision Info
- Active revision (canary)
- Stable revision
- Canary weight (typically 10%)
- Traffic distribution

### 🧠 ML Analyzer Results
- ML decision: `PROMOTE` / `ROLLBACK` / `DEGRADED`
- Confidence score (0-100%)
- Summary of findings
- List of detected anomalies

### 📊 Health Metrics
- Success/failure percentages
- Total health checks
- Recent check history

### 📄 Live Logs
- Most recent 50 log lines
- Formatted for easy reading

## 🔄 Auto-Refresh

The dashboard automatically refreshes every 10 seconds, pulling the latest `latest_canary_status.json` file.

## 🚀 How It Works

1. **ML Canary Analyzer** or **Auto-Canary Supervisor** runs
2. Workflow completes and triggers **Publish Dashboard** workflow
3. Dashboard builder merges logs + ML results + revision info
4. GitHub Pages publishes the updated dashboard
5. Dashboard auto-refreshes to show latest data

## 🛠️ Manual Update

To manually trigger a dashboard update:

```bash
# In GitHub Actions UI:
Actions → "📊 Publish Canary Dashboard" → Run workflow
```

Or run the builder script locally:

```bash
node tools/build_dashboard_json.js
```

## 📁 Files

- `index.html` - Dashboard UI (auto-refreshing)
- `latest_canary_status.json` - Data file (auto-generated)
- `.github/workflows/publish_dashboard.yml` - Publisher workflow
- `tools/build_dashboard_json.js` - JSON builder script

## 🎨 Status Colors

- 🟢 **Green** - `PROMOTE` (canary is healthy)
- 🟡 **Yellow** - `DEGRADED` (needs review)
- 🔴 **Red** - `ROLLBACK` (critical issues)

## 🔧 Setup

1. Enable GitHub Pages in repository settings
2. Set source to `gh-pages` branch
3. Run a canary deployment workflow
4. Dashboard will auto-publish after ML analysis completes
