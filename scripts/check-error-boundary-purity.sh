#!/bin/bash
# check-error-boundary-purity.sh
# 
# CI GUARD: Prevents React hooks in App Router error boundaries
# 
# WHY: Error boundaries render before providers exist. Any hook usage causes:
# "TypeError: Cannot read properties of null (reading 'useContext')"
# during SSR/prerender, breaking the build.
# 
# WHAT IT CHECKS:
# - Scans all error.tsx and global-error.tsx files
# - Detects ANY React hook usage (use*, useContext, useState, etc.)
# - Fails fast with file + line number
# 
# USAGE:
#   ./scripts/check-error-boundary-purity.sh
#
# EXIT CODES:
#   0 - All error boundaries are pure (no hooks)
#   1 - Found hooks in error boundaries (BUILD SHOULD FAIL)
#   2 - Script error

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "🔒 Checking Error Boundary Purity..."
echo "===================================="
echo ""

# Find all error boundary files
ERROR_FILES=$(find apps/web/app -type f \( -name "error.tsx" -o -name "global-error.tsx" \) 2>/dev/null || true)

if [ -z "$ERROR_FILES" ]; then
  echo -e "${YELLOW}⚠️  No error boundary files found${NC}"
  echo "Searched in: apps/web/app"
  exit 0
fi

echo "📁 Found error boundary files:"
echo "$ERROR_FILES" | sed 's/^/  - /'
echo ""

# Patterns to detect (hook usage)
HOOK_PATTERNS=(
  "useContext\s*\("
  "useState\s*\("
  "useEffect\s*\("
  "useLayoutEffect\s*\("
  "useReducer\s*\("
  "useCallback\s*\("
  "useMemo\s*\("
  "useRef\s*\("
  "useImperativeHandle\s*\("
  "useRouter\s*\("
  "usePathname\s*\("
  "useSearchParams\s*\("
  "useParams\s*\("
  "useTheme\s*\("
  "useToast\s*\("
  "use[A-Z][a-zA-Z]*\s*\("
)

VIOLATIONS_FOUND=0
VIOLATION_DETAILS=""

echo "🔍 Scanning for prohibited hooks..."
echo ""

# Check each file
for file in $ERROR_FILES; do
  FILE_VIOLATIONS=0
  
  # Check each pattern
  for pattern in "${HOOK_PATTERNS[@]}"; do
    # Use grep to find matches, excluding comment lines
    # Filter out lines that are comments (start with //, /*, or *)
    # The grep output format is "linenum:content", so we check the content part after the colon
    MATCHES=$(grep -n -E "$pattern" "$file" 2>/dev/null | grep -v -E ':[[:space:]]*(//|/\*|\*)' || true)
    
    if [ ! -z "$MATCHES" ]; then
      if [ $FILE_VIOLATIONS -eq 0 ]; then
        VIOLATION_DETAILS="${VIOLATION_DETAILS}\n${RED}❌ VIOLATIONS in ${file}:${NC}\n"
      fi
      
      FILE_VIOLATIONS=$((FILE_VIOLATIONS + 1))
      VIOLATIONS_FOUND=$((VIOLATIONS_FOUND + 1))
      
      # Extract hook name from pattern
      HOOK_NAME=$(echo "$pattern" | sed 's/\\s\*\\($//' | sed 's/\[A-Z\].*/[Hook]/')
      
      # Add details
      while IFS= read -r line; do
        LINE_NUM=$(echo "$line" | cut -d: -f1)
        LINE_CONTENT=$(echo "$line" | cut -d: -f2-)
        VIOLATION_DETAILS="${VIOLATION_DETAILS}  Line ${LINE_NUM}: ${HOOK_NAME}\n"
        VIOLATION_DETAILS="${VIOLATION_DETAILS}    ${YELLOW}${LINE_CONTENT}${NC}\n"
      done <<< "$MATCHES"
      
      VIOLATION_DETAILS="${VIOLATION_DETAILS}\n"
    fi
  done
done

# Report results
if [ $VIOLATIONS_FOUND -eq 0 ]; then
  echo -e "${GREEN}✅ All error boundaries are pure!${NC}"
  echo ""
  echo "No React hooks detected in error boundaries."
  echo "Error boundaries are SSR-safe and will not crash during prerender."
  echo ""
  exit 0
else
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${RED}❌ ERROR BOUNDARY PURITY VIOLATION DETECTED!${NC}"
  echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo -e "Found ${RED}${VIOLATIONS_FOUND}${NC} hook usage(s) in error boundaries:"
  echo ""
  echo -e "$VIOLATION_DETAILS"
  echo ""
  echo -e "${BLUE}WHY THIS FAILS:${NC}"
  echo "Error boundaries in Next.js App Router render BEFORE any providers exist."
  echo "Using hooks causes: \"Cannot read properties of null (reading 'useContext')\""
  echo "during SSR/prerender, which breaks the production build."
  echo ""
  echo -e "${BLUE}HOW TO FIX:${NC}"
  echo "1. Remove ALL hooks from error boundary files"
  echo "2. Use pure JSX + inline styles only"
  echo "3. Do NOT import UI components that use hooks"
  echo "4. See: ERROR_BOUNDARY_RULES.md for detailed guidance"
  echo ""
  echo -e "${RED}BUILD MUST FAIL - This violation prevents production deployment.${NC}"
  echo ""
  exit 1
fi

