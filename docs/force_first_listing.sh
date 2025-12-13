#!/bin/bash
# Force First Listing Script
# Guaranteed 1-minute listing submission for production

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Magnus Flipper AI - First Listing       ║${NC}"
echo -e "${BLUE}║   5-Minute Production Launch               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# Configuration
API_URL="https://flipperagents.com"
MARKETPLACE="${1:-facebook}"

# Check marketplace
if [ "$MARKETPLACE" != "facebook" ] && [ "$MARKETPLACE" != "vinted" ]; then
    echo -e "${RED}❌ Invalid marketplace. Use: facebook or vinted${NC}"
    exit 1
fi

# Get auth token
echo -e "${YELLOW}🔐 Step 1: Authentication${NC}"
echo "Please provide your session token (from browser DevTools → Cookies → sb-access-token):"
read -s AUTH_TOKEN

if [ -z "$AUTH_TOKEN" ]; then
    echo -e "${RED}❌ Auth token required${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Auth token set${NC}"
echo ""

# Choose method
echo -e "${YELLOW}📋 Choose method:${NC}"
echo "  1. Submit URL (Fastest - 30 seconds)"
echo "  2. Create Search (Automatic - 2-10 minutes)"
echo ""
read -p "Enter choice (1 or 2): " METHOD

if [ "$METHOD" = "1" ]; then
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}📎 Method 1: Direct URL Submission${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    # Get URL
    echo "Enter a public $MARKETPLACE listing URL:"
    if [ "$MARKETPLACE" = "facebook" ]; then
        echo "Example: https://www.facebook.com/marketplace/item/123456789/"
    else
        echo "Example: https://www.vinted.com/items/123456789"
    fi
    read LISTING_URL
    
    if [ -z "$LISTING_URL" ]; then
        echo -e "${RED}❌ URL required${NC}"
        exit 1
    fi
    
    echo ""
    echo -e "${YELLOW}📤 Submitting listing...${NC}"
    
    # Submit URL
    RESPONSE=$(curl -s -X POST "$API_URL/api/ingest/$MARKETPLACE/submit" \
        -H "Content-Type: application/json" \
        -H "Cookie: sb-access-token=$AUTH_TOKEN" \
        -d "{\"url\":\"$LISTING_URL\"}")
    
    SUCCESS=$(echo "$RESPONSE" | jq -r '.success // false')
    LISTING_ID=$(echo "$RESPONSE" | jq -r '.listingId // "unknown"')
    
    if [ "$SUCCESS" = "true" ]; then
        echo -e "${GREEN}✅ Listing submitted successfully!${NC}"
        echo -e "   Listing ID: ${LISTING_ID}"
        echo ""
        
        echo -e "${YELLOW}⏳ Waiting 5 seconds for processing...${NC}"
        sleep 5
        
        echo -e "${YELLOW}🔍 Verifying listing in database...${NC}"
        DEALS_RESPONSE=$(curl -s "$API_URL/api/deals?marketplace=$MARKETPLACE" \
            -H "Cookie: sb-access-token=$AUTH_TOKEN")
        
        COUNT=$(echo "$DEALS_RESPONSE" | jq '.deals | length')
        
        if [ "$COUNT" -gt 0 ]; then
            echo -e "${GREEN}✅ Found $COUNT listing(s) in database!${NC}"
            echo ""
            echo -e "${YELLOW}📊 First listing:${NC}"
            echo "$DEALS_RESPONSE" | jq '.deals[0] | {title, buyPrice, marketplace, status}'
            echo ""
            
            echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
            echo -e "${GREEN}║            🎉 SUCCESS! 🎉                  ║${NC}"
            echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
            echo ""
            echo -e "${YELLOW}Next steps:${NC}"
            echo "  1. Visit: $API_URL/marketplaces/$MARKETPLACE"
            echo "  2. Verify listing card is visible"
            echo "  3. If title shows 'Pending hydration...', wait 30s for worker"
            echo ""
        else
            echo -e "${RED}⚠️  No listings found yet. Checking error...${NC}"
            echo "$DEALS_RESPONSE" | jq
        fi
    else
        echo -e "${RED}❌ Failed to submit listing${NC}"
        echo "$RESPONSE" | jq
        exit 1
    fi
    
elif [ "$METHOD" = "2" ]; then
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}🔍 Method 2: Create Search${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    # Get search details
    read -p "Search name (e.g., 'iPhone 12'): " SEARCH_NAME
    read -p "Keywords (comma-separated, e.g., 'iphone,iphone 12'): " KEYWORDS_INPUT
    read -p "Min price (optional, press Enter to skip): " MIN_PRICE
    read -p "Max price (optional, press Enter to skip): " MAX_PRICE
    
    # Convert keywords to JSON array
    IFS=',' read -ra KEYWORDS_ARRAY <<< "$KEYWORDS_INPUT"
    KEYWORDS_JSON=$(printf '%s\n' "${KEYWORDS_ARRAY[@]}" | jq -R . | jq -s .)
    
    # Build request body
    REQUEST_BODY=$(jq -n \
        --arg name "$SEARCH_NAME" \
        --argjson keywords "$KEYWORDS_JSON" \
        --arg marketplace "$MARKETPLACE" \
        --arg minPrice "$MIN_PRICE" \
        --arg maxPrice "$MAX_PRICE" \
        '{
            name: $name,
            keywords: $keywords,
            marketplace: $marketplace
        } + (if $minPrice != "" then {minPrice: $minPrice} else {} end)
          + (if $maxPrice != "" then {maxPrice: $maxPrice} else {} end)')
    
    echo ""
    echo -e "${YELLOW}📤 Creating search...${NC}"
    
    RESPONSE=$(curl -s -X POST "$API_URL/api/searches" \
        -H "Content-Type: application/json" \
        -H "Cookie: sb-access-token=$AUTH_TOKEN" \
        -d "$REQUEST_BODY")
    
    SEARCH_ID=$(echo "$RESPONSE" | jq -r '.id // "unknown"')
    
    if [ "$SEARCH_ID" != "unknown" ] && [ "$SEARCH_ID" != "null" ]; then
        echo -e "${GREEN}✅ Search created successfully!${NC}"
        echo -e "   Search ID: ${SEARCH_ID}"
        echo ""
        
        echo -e "${YELLOW}⏳ Waiting for worker to process (this may take 2-10 minutes)...${NC}"
        echo -e "   Workers run every 10 minutes. Please be patient."
        echo ""
        
        # Poll for listings (max 15 minutes)
        MAX_ATTEMPTS=30
        ATTEMPT=0
        FOUND=false
        
        while [ $ATTEMPT -lt $MAX_ATTEMPTS ] && [ "$FOUND" = "false" ]; do
            ATTEMPT=$((ATTEMPT + 1))
            echo -e "${YELLOW}⏳ Checking... (attempt $ATTEMPT/$MAX_ATTEMPTS)${NC}"
            
            DEALS_RESPONSE=$(curl -s "$API_URL/api/deals?marketplace=$MARKETPLACE" \
                -H "Cookie: sb-access-token=$AUTH_TOKEN")
            
            COUNT=$(echo "$DEALS_RESPONSE" | jq '.deals | length')
            
            if [ "$COUNT" -gt 0 ]; then
                FOUND=true
                echo -e "${GREEN}✅ Found $COUNT listing(s)!${NC}"
                echo ""
                echo -e "${YELLOW}📊 First listing:${NC}"
                echo "$DEALS_RESPONSE" | jq '.deals[0] | {title, buyPrice, marketplace, status}'
                echo ""
                
                echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
                echo -e "${GREEN}║            🎉 SUCCESS! 🎉                  ║${NC}"
                echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
                echo ""
                echo -e "${YELLOW}Next steps:${NC}"
                echo "  1. Visit: $API_URL/marketplaces/$MARKETPLACE"
                echo "  2. Verify listing card is visible"
                echo ""
                break
            else
                sleep 30
            fi
        done
        
        if [ "$FOUND" = "false" ]; then
            echo -e "${RED}⚠️  Timeout: No listings found after 15 minutes${NC}"
            echo ""
            echo -e "${YELLOW}Troubleshooting:${NC}"
            echo "  1. Check worker status:"
            echo "     curl $API_URL/api/health/workers | jq"
            echo ""
            echo "  2. Check worker logs:"
            echo "     az containerapp logs show --name mf-worker-scheduler -g magnus-rg --tail 20"
            echo ""
            echo "  3. Try Method 1 (URL submission) for instant results"
        fi
    else
        echo -e "${RED}❌ Failed to create search${NC}"
        echo "$RESPONSE" | jq
        exit 1
    fi
else
    echo -e "${RED}❌ Invalid choice${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📚 For more details, see: docs/5_MINUTE_FIRST_LISTING_CHECKLIST.md${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
