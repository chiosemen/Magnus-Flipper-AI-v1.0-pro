#!/bin/bash
# Collect deployment status and logs for all services

API_KEY="rnd_kmt4A9ljMOEZL3wLYJKCR81T6elW"

# Service IDs from the diagnostics
declare -A SERVICES
SERVICES["magnus-worker-crawler"]="srv-d4gessre5dus73bitpf0"
SERVICES["magnus-flipper-api"]="srv-d4gessre5dus73bitpcg"
SERVICES["magnus-worker-analyzer"]="srv-d4gessre5dus73bitpdg"
SERVICES["magnus-worker-alerts"]="srv-d4gessre5dus73bitpe0"
SERVICES["magnus-telegram-bot"]="srv-d4gessre5dus73bitpeg"
SERVICES["magnus-scheduler"]="srv-d4gessre5dus73bitpc0"

OUTPUT="service_status_$(date +%Y%m%d_%H%M%S).txt"

echo "=====================================================================================================" > "$OUTPUT"
echo " MAGNUS FLIPPER - SERVICE STATUS & LOGS REPORT " >> "$OUTPUT"
echo " Generated: $(date)" >> "$OUTPUT"
echo "=====================================================================================================" >> "$OUTPUT"

for name in "${!SERVICES[@]}"; do
    id="${SERVICES[$name]}"

    echo "" >> "$OUTPUT"
    echo "=====================================================================================================" >> "$OUTPUT"
    echo " SERVICE: $name (ID: $id)" >> "$OUTPUT"
    echo "=====================================================================================================" >> "$OUTPUT"

    # Get deploys for this service
    echo "" >> "$OUTPUT"
    echo "📋 RECENT DEPLOYS:" >> "$OUTPUT"
    echo "---------------------------------------------------------------------------------------------------" >> "$OUTPUT"
    curl -s --request GET \
         --url "https://api.render.com/v1/services/$id/deploys?limit=3" \
         --header 'Accept: application/json' \
         --header "Authorization: Bearer $API_KEY" | jq -r '.[] | .deploy | "Deploy ID: \(.id)\nStatus: \(.status)\nCreated: \(.createdAt)\nFinished: \(.finishedAt)\n"' >> "$OUTPUT" 2>/dev/null || echo "Failed to fetch deploys" >> "$OUTPUT"

    # Get logs for this service
    echo "" >> "$OUTPUT"
    echo "📜 RECENT LOGS (last 100 lines):" >> "$OUTPUT"
    echo "---------------------------------------------------------------------------------------------------" >> "$OUTPUT"
    curl -s --request GET \
         --url "https://api.render.com/v1/services/$id/logs?limit=100" \
         --header 'Accept: application/json' \
         --header "Authorization: Bearer $API_KEY" | jq -r '.[].log | "\(.timestamp) | \(.message)"' >> "$OUTPUT" 2>/dev/null || echo "Failed to fetch logs" >> "$OUTPUT"

    echo "" >> "$OUTPUT"
done

echo "" >> "$OUTPUT"
echo "=====================================================================================================" >> "$OUTPUT"
echo " REPORT COMPLETE " >> "$OUTPUT"
echo "=====================================================================================================" >> "$OUTPUT"

echo "✅ Status and logs collected!"
echo "📄 File: $OUTPUT"
echo ""
echo "Please run: cat $OUTPUT"
echo "Then copy and paste the output back to Claude"
