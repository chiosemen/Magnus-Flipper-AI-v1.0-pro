#!/usr/bin/env bash
set -euo pipefail

ROOT="/Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro"
cd "$ROOT"

LOG_FILE="${1:-render-build.log}"

if [ ! -f "$LOG_FILE" ]; then
  echo "❌ Log file not found: $LOG_FILE"
  echo "Usage: scripts/render-log-analyzer.sh path/to/render-build.log"
  exit 1
fi

echo "======================================================="
echo "🧪 RENDER BUILD LOG ANALYZER"
echo "Log: $LOG_FILE"
echo "======================================================="

TOTAL_LINES=$(wc -l < "$LOG_FILE" | tr -d ' ')
ERROR_LINES=$(grep -Eic "error|failed|exception" "$LOG_FILE" || true)
WARN_LINES=$(grep -Eic "warn(ing)?" "$LOG_FILE" || true)
TIME_LINES=$(grep -Eic "Time:|Duration:|Built in" "$LOG_FILE" || true)

echo ""
echo "📊 Summary"
echo "  • Total lines: $TOTAL_LINES"
echo "  • Errors:      $ERROR_LINES"
echo "  • Warnings:    $WARN_LINES"
echo "  • Timing info: $TIME_LINES"

echo ""
echo "❗ Top 20 error lines (if any):"
echo "-------------------------------------------------------"
grep -Ein "error|failed|exception" "$LOG_FILE" | head -20 || echo "No errors found."

echo ""
echo "⚠️ Top 20 warning lines (if any):"
echo "-------------------------------------------------------"
grep -Ein "warn(ing)?" "$LOG_FILE" | head -20 || echo "No warnings found."

echo ""
echo "⏱ Timing / duration lines:"
echo "-------------------------------------------------------"
grep -Ein "Time:|Duration:|Built in" "$LOG_FILE" | head -20 || echo "No timing lines found."

echo ""
echo "✅ Analysis complete."
echo "Tip: For deeper analysis, open the log in your editor and jump to the line numbers above."
