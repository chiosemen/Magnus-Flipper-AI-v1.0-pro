#!/bin/bash
# Render Service Status Collector - macOS Compatible
# Collects deployment status and logs for all Magnus Flipper services

API_KEY="rnd_kmt4A9ljMOEZL3wLYJKCR81T6elW"
OUTPUT="service_status_full_$(date +%Y%m%d_%H%M%S).txt"

echo "=====================================================================================================" > "$OUTPUT"
echo " MAGNUS FLIPPER - COMPREHENSIVE SERVICE DIAGNOSTICS " >> "$OUTPUT"
echo " Generated: $(date)" >> "$OUTPUT"
echo "=====================================================================================================" >> "$OUTPUT"

# Service IDs
services=(
  "magnus-worker-crawler:srv-d4gessre5dus73bitpf0"
  "magnus-flipper-api:srv-d4gessre5dus73bitpcg"
  "magnus-worker-analyzer:srv-d4gessre5dus73bitpdg"
  "magnus-worker-alerts:srv-d4gessre5dus73bitpe0"
  "magnus-telegram-bot:srv-d4gessre5dus73bitpeg"
  "magnus-scheduler:srv-d4gessre5dus73bitpc0"
)

for service in "${services[@]}"; do
    IFS=':' read -r name id <<< "$service"

    echo "" >> "$OUTPUT"
    echo "=====================================================================================================" >> "$OUTPUT"
    echo " SERVICE: $name" >> "$OUTPUT"
    echo " ID: $id" >> "$OUTPUT"
    echo "=====================================================================================================" >> "$OUTPUT"

    # Get recent deploys
    echo "" >> "$OUTPUT"
    echo "📋 RECENT DEPLOYS:" >> "$OUTPUT"
    echo "---------------------------------------------------------------------------------------------------" >> "$OUTPUT"

    curl -s --request GET \
         --url "https://api.render.com/v1/services/$id/deploys?limit=5" \
         --header 'Accept: application/json' \
         --header "Authorization: Bearer $API_KEY" >> "$OUTPUT"

    echo "" >> "$OUTPUT"
    echo "" >> "$OUTPUT"

    # Get service events/logs
    echo "📜 SERVICE EVENTS:" >> "$OUTPUT"
    echo "---------------------------------------------------------------------------------------------------" >> "$OUTPUT"

    curl -s --request GET \
         --url "https://api.render.com/v1/services/$id/events?limit=50" \
         --header 'Accept: application/json' \
         --header "Authorization: Bearer $API_KEY" >> "$OUTPUT"

    echo "" >> "$OUTPUT"
    echo "" >> "$OUTPUT"
done

echo "" >> "$OUTPUT"
echo "=====================================================================================================" >> "$OUTPUT"
echo " DIAGNOSTICS COMPLETE " >> "$OUTPUT"
echo "=====================================================================================================" >> "$OUTPUT"

echo "✅ Full diagnostics collected!"
echo "📄 File: $OUTPUT"
echo ""
echo "Run: cat $OUTPUT | pbcopy    # to copy to clipboard"
echo "Or: cat $OUTPUT              # to display"
