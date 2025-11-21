# 🧪 Render Build Logs Analyzer - User Guide

**Quickly analyze Render build/deployment logs to identify errors, warnings, and performance bottlenecks**

---

## 📋 Overview

The Render Log Analyzer is a bash script that:
- Scans build/deployment logs from Render
- Identifies errors, warnings, and timing information
- Provides a quick summary with line numbers
- Helps debug failed deployments

---

## 🚀 Quick Start

### 1. Get Logs from Render

**Option A: Copy from Dashboard**

1. Go to https://dashboard.render.com
2. Select your service (e.g., `magnus-flipper-api`)
3. Click **Logs** tab
4. Copy all logs
5. Save to file:
   ```bash
   cd /Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro
   nano render-build.log  # Paste logs and save
   ```

**Option B: Via Render CLI** (if available)

```bash
render logs magnus-flipper-api > render-build.log
```

**Option C: Via API**

```bash
curl -H "Authorization: Bearer $RENDER_API_KEY" \
  "https://api.render.com/v1/services/srv-xxxxx/logs" > render-build.log
```

### 2. Run Analyzer

```bash
./scripts/render-log-analyzer.sh render-build.log
```

**Output**:
```
=======================================================
🧪 RENDER BUILD LOG ANALYZER
Log: render-build.log
=======================================================

📊 Summary
  • Total lines: 1523
  • Errors:      3
  • Warnings:    12
  • Timing info: 8

❗ Top 20 error lines (if any):
-------------------------------------------------------
245:Error: Cannot find module '-flipper-ai/core'
612:npm ERR! code ELIFECYCLE
817:Error: Build failed with exit code 1

⚠️ Top 20 warning lines (if any):
-------------------------------------------------------
89:Warning: Deprecated dependency 'request'
156:npm WARN deprecated @babel/plugin-proposal-class-properties
...

⏱ Timing / duration lines:
-------------------------------------------------------
1499:Built in 240ms
1512:Duration: 3m 45s
...

✅ Analysis complete.
Tip: For deeper analysis, open the log in your editor and jump to the line numbers above.
```

---

## 📖 Usage Examples

### Example 1: Analyze Default Log

```bash
# Assumes log is at: render-build.log
./scripts/render-log-analyzer.sh
```

### Example 2: Analyze Specific Log

```bash
# Analyze a specific log file
./scripts/render-log-analyzer.sh logs/api-deploy-2025-11-20.log
```

### Example 3: Analyze Multiple Services

```bash
# Analyze each service log
./scripts/render-log-analyzer.sh api-build.log
./scripts/render-log-analyzer.sh crawler-build.log
./scripts/render-log-analyzer.sh scheduler-build.log
```

### Example 4: Save Analysis Report

```bash
# Save analysis to file
./scripts/render-log-analyzer.sh render-build.log > analysis-report.txt
```

---

## 🔍 What It Detects

### Errors

Patterns matched:
- `error`
- `failed`
- `exception`
- `Error:`
- `ERROR:`
- `npm ERR!`

### Warnings

Patterns matched:
- `warn`
- `warning`
- `Warning:`
- `WARN:`
- `npm WARN`

### Timing Information

Patterns matched:
- `Time:`
- `Duration:`
- `Built in`
- `Finished in`

---

## 📊 Interpreting Results

### Healthy Build

```
📊 Summary
  • Total lines: 850
  • Errors:      0
  • Warnings:    2
  • Timing info: 5

❗ Top 20 error lines (if any):
-------------------------------------------------------
No errors found.

⚠️ Top 20 warning lines (if any):
-------------------------------------------------------
156:npm WARN deprecated @babel/plugin-proposal-class-properties
234:Warning: Using experimental feature

⏱ Timing / duration lines:
-------------------------------------------------------
842:Built in 2.4s
848:Duration: 1m 23s
```

**Analysis**: ✅ Build successful, 2 minor warnings (acceptable)

### Failed Build

```
📊 Summary
  • Total lines: 1234
  • Errors:      15
  • Warnings:    8
  • Timing info: 3

❗ Top 20 error lines (if any):
-------------------------------------------------------
567:Error: Cannot find module '-flipper-ai/core'
568:    at Function.Module._resolveFilename (internal/modules/cjs/loader.js:636:15)
712:npm ERR! code ELIFECYCLE
713:npm ERR! errno 1
```

**Analysis**: ❌ Build failed - Missing module `-flipper-ai/core`

**Fix**:
1. Check `package.json` dependencies
2. Run `pnpm install` locally
3. Ensure workspace references correct
4. Redeploy after fix

---

## 🛠️ Common Issues & Fixes

### Issue 1: "Cannot find module"

**Log**:
```
Error: Cannot find module '-flipper-ai/core'
```

**Cause**: Missing dependency or incorrect workspace reference

**Fix**:
```bash
# Verify package exists
ls packages/core

# Check package.json references
grep -r "-flipper-ai/core" package.json

# Reinstall
pnpm install

# Rebuild
pnpm turbo run build
```

### Issue 2: "npm ERR! code ELIFECYCLE"

**Log**:
```
npm ERR! code ELIFECYCLE
npm ERR! errno 1
```

**Cause**: Build script failed (check lines before this error)

**Fix**:
1. Scroll up in log to find actual error
2. Common causes:
   - TypeScript compilation error
   - Missing environment variable
   - Syntax error in code

### Issue 3: Out of Memory

**Log**:
```
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

**Cause**: Not enough memory for build

**Fix**:
- Upgrade Render plan (more memory)
- Or reduce build concurrency:
  ```bash
  # In package.json build script
  "build": "NODE_OPTIONS='--max-old-space-size=2048' turbo build"
  ```

### Issue 4: Playwright Installation Failed

**Log**:
```
Error: Failed to install browsers
```

**Cause**: Playwright install failed in crawler worker

**Fix**:
```yaml
# In render.yaml, ensure:
buildCommand: |
  pnpm install --frozen-lockfile
  npx playwright install --with-deps chromium
```

### Issue 5: Slow Build (> 5 minutes)

**Log**:
```
Duration: 8m 34s
```

**Cause**: Inefficient build process

**Fix**:
1. Enable Turbo cache:
   ```bash
   pnpm turbo run build --cache-dir=.turbo
   ```
2. Optimize dependencies:
   ```bash
   # Remove unused deps
   pnpm prune
   ```
3. Use smaller Docker image
4. Parallelize builds in turbo.json

---

## 📈 Performance Analysis

### Understanding Build Times

**Typical build times**:
- API: 30-60 seconds
- Scheduler: 20-40 seconds
- Crawler (with Playwright): 2-4 minutes
- Analyzer: 20-40 seconds
- Alerts: 20-40 seconds
- Bot: 30-60 seconds

### Identifying Bottlenecks

Look for timing lines:
```bash
grep -i "time\|duration\|built in" render-build.log
```

**Example**:
```
Building -flipper-ai/core... Done in 12.3s
Building -flipper-ai/api... Done in 8.7s
Installing Playwright browsers... Done in 2m 15s  ← Bottleneck!
```

**Fix**: Pre-build Playwright in Docker image

---

## 🔬 Advanced Analysis

### Find Specific Patterns

```bash
# Find memory errors
grep -i "out of memory\|heap" render-build.log

# Find timeout errors
grep -i "timeout\|timed out" render-build.log

# Find network errors
grep -i "network\|ECONNREFUSED\|ETIMEDOUT" render-build.log

# Find permission errors
grep -i "permission denied\|EACCES" render-build.log
```

### Extract Build Steps

```bash
# Find all "Building" lines
grep "Building" render-build.log

# Find all "Installing" lines
grep "Installing" render-build.log

# Find all "Done" lines
grep "Done in" render-build.log
```

### Compare Builds

```bash
# Save analysis of each build
./scripts/render-log-analyzer.sh build-v1.log > analysis-v1.txt
./scripts/render-log-analyzer.sh build-v2.log > analysis-v2.txt

# Compare
diff analysis-v1.txt analysis-v2.txt
```

---

## 📝 Creating Test Logs

### Sample Error Log

Create `test-error.log`:
```
[2025-11-20 10:23:45] Building magnus-flipper-api...
[2025-11-20 10:23:48] Installing dependencies...
[2025-11-20 10:24:12] Done. Packages: 456
[2025-11-20 10:24:13] Building packages/api...
[2025-11-20 10:24:15] Error: Cannot find module '-flipper-ai/core'
[2025-11-20 10:24:15]     at Function.Module._resolveFilename (internal/modules/cjs/loader.js:636:15)
[2025-11-20 10:24:15] npm ERR! code ELIFECYCLE
[2025-11-20 10:24:15] npm ERR! errno 1
[2025-11-20 10:24:15] Build failed with exit code 1
[2025-11-20 10:24:16] Duration: 31s
```

Test:
```bash
./scripts/render-log-analyzer.sh test-error.log
```

---

## 💡 Pro Tips

### 1. Automate Log Collection

Create `scripts/fetch-render-logs.sh`:
```bash
#!/bin/bash
# Fetch logs from all services
SERVICES=("api" "scheduler" "crawler" "analyzer" "alerts" "bot")

for service in "${SERVICES[@]}"; do
  echo "Fetching logs for magnus-flipper-$service..."
  render logs "magnus-flipper-$service" > "logs/$service-$(date +%Y%m%d-%H%M%S).log"
  ./scripts/render-log-analyzer.sh "logs/$service-$(date +%Y%m%d-%H%M%S).log" > "logs/$service-analysis.txt"
done
```

### 2. Monitor Build Health

Set up daily cron job:
```bash
# Add to crontab
0 9 * * * cd /path/to/magnus && ./scripts/fetch-render-logs.sh && mail -s "Build Report" you@email.com < logs/*-analysis.txt
```

### 3. Create Alerts

```bash
# Alert if errors detected
ERROR_COUNT=$(./scripts/render-log-analyzer.sh render-build.log | grep "Errors:" | awk '{print $3}')

if [ "$ERROR_COUNT" -gt 0 ]; then
  echo "⚠️ Build errors detected! Count: $ERROR_COUNT"
  # Send alert (Slack, email, etc.)
fi
```

---

## ✅ Checklist

Before analyzing:
- [ ] Log file collected from Render
- [ ] Analyzer script is executable
- [ ] Log file path is correct

After analyzing:
- [ ] Review error count
- [ ] Check warning severity
- [ ] Note slow build steps
- [ ] Fix identified issues
- [ ] Redeploy and re-analyze

---

## 🆘 Troubleshooting

### Script won't run

```bash
# Make executable
chmod +x scripts/render-log-analyzer.sh

# Check path
ls -la scripts/render-log-analyzer.sh

# Run with bash explicitly
bash scripts/render-log-analyzer.sh render-build.log
```

### "Log file not found"

```bash
# Check current directory
pwd

# Should be: /Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro

# List log files
ls *.log

# Use full path
./scripts/render-log-analyzer.sh /full/path/to/render-build.log
```

### No errors/warnings shown but build failed

**Cause**: Error pattern not matched

**Solution**:
```bash
# Search manually
cat render-build.log | less
# Search for: /fail or /error (in less)

# Or use grep with broader pattern
grep -i "fail\|error\|exception\|fatal" render-build.log
```

---

## 📚 Related Scripts

- `scripts/render-sync-env.sh` - Sync environment variables
- `scripts/verify-crawler-build.sh` - Verify crawler build
- `scripts/magnus_stability_god_v5.sh` - Full monorepo health check

---

**🧪 Render Log Analyzer is ready to use!**

Quickly diagnose build issues and optimize deployment times.
