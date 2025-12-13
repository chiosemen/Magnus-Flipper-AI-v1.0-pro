#!/bin/bash
# Fix UI package imports to use barrel exports
# This script updates all imports from individual component files to barrel exports

set -e

echo "🔧 Fixing @magnus-flipper-ai/ui imports..."

# Find all TypeScript/TSX files in apps/web
files=$(find apps/web -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v ".next")

for file in $files; do
  # Check if file has the old import pattern
  if grep -q 'from "@magnus-flipper-ai/ui/components/Button"' "$file" || \
     grep -q 'from "@magnus-flipper-ai/ui/components/Card"' "$file"; then
    
    echo "  Processing: $file"
    
    # Use a temp file for safe replacement
    temp_file="${file}.tmp"
    cp "$file" "$temp_file"
    
    # Replace individual Button imports
    sed -i '' 's|import { Button } from "@magnus-flipper-ai/ui/components/Button";|import { Button } from "@magnus-flipper-ai/ui/components";|g' "$temp_file"
    
    # Replace individual Card imports  
    sed -i '' 's|import { Card } from "@magnus-flipper-ai/ui/components/Card";|import { Card } from "@magnus-flipper-ai/ui/components";|g' "$temp_file"
    
    # Handle files that import both Button and Card separately
    # Combine them into a single import if they're consecutive
    awk '
      /import.*Button.*from "@magnus-flipper-ai\/ui\/components"/ {
        button_line = $0
        button_found = 1
        next
      }
      /import.*Card.*from "@magnus-flipper-ai\/ui\/components"/ {
        if (button_found) {
          # Combine imports
          print "import { Button, Card } from \"@magnus-flipper-ai/ui/components\";"
          button_found = 0
          next
        }
        card_line = $0
        card_found = 1
        next
      }
      {
        if (button_found) {
          print button_line
          button_found = 0
        }
        if (card_found) {
          print card_line
          card_found = 0
        }
        print
      }
    ' "$temp_file" > "${temp_file}.2"
    
    mv "${temp_file}.2" "$file"
    rm -f "$temp_file"
  fi
done

echo "✅ Fixed UI imports - now using barrel exports"
echo ""
echo "Pattern changed:"
echo '  Before: import { Button } from "@magnus-flipper-ai/ui/components/Button"'
echo '  After:  import { Button } from "@magnus-flipper-ai/ui/components"'
