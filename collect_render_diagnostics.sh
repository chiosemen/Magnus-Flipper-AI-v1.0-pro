#!/bin/bash
# Render Diagnostics Collection Script
# Run this on your LOCAL machine and paste the output back to Claude

API_KEY="rnd_kmt4A9ljMOEZL3wLYJKCR81T6elW"
OUTPUT_FILE="render_diagnostics_$(date +%Y%m%d_%H%M%S).json"

echo "🔍 Collecting Render diagnostics..."
echo "📁 Output will be saved to: $OUTPUT_FILE"
echo ""

# Initialize JSON output
echo "{" > "$OUTPUT_FILE"

# 1. Get all services
echo "📋 Fetching all services..."
echo '  "services": ' >> "$OUTPUT_FILE"
curl -s --request GET \
     --url 'https://api.render.com/v1/services?limit=100' \
     --header 'Accept: application/json' \
     --header "Authorization: Bearer $API_KEY" >> "$OUTPUT_FILE"
echo "," >> "$OUTPUT_FILE"

# 2. Get PostgreSQL instances
echo "🐘 Fetching PostgreSQL instances..."
echo '  "postgres": ' >> "$OUTPUT_FILE"
curl -s --request GET \
     --url 'https://api.render.com/v1/postgres' \
     --header 'Accept: application/json' \
     --header "Authorization: Bearer $API_KEY" >> "$OUTPUT_FILE"
echo "," >> "$OUTPUT_FILE"

# 3. Get Redis instances
echo "🔴 Fetching Redis instances..."
echo '  "redis": ' >> "$OUTPUT_FILE"
curl -s --request GET \
     --url 'https://api.render.com/v1/redis' \
     --header 'Accept: application/json' \
     --header "Authorization: Bearer $API_KEY" >> "$OUTPUT_FILE"

echo "}" >> "$OUTPUT_FILE"

echo ""
echo "✅ Diagnostics collected successfully!"
echo "📄 File: $OUTPUT_FILE"
echo ""
echo "📤 Please run: cat $OUTPUT_FILE"
echo "   Then copy the entire output and paste it back to Claude"
echo ""
