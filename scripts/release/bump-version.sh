#!/bin/bash
# Version bump script for Magnus Flipper AI monorepo
# Usage: ./scripts/release/bump-version.sh [major|minor|patch] [version]

set -e

VERSION_TYPE="${1:-patch}"
SPECIFIC_VERSION="${2:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to bump version
bump_version() {
  local current_version=$1
  local version_type=$2
  
  if [ -n "$SPECIFIC_VERSION" ]; then
    echo "$SPECIFIC_VERSION"
    return
  fi
  
  IFS='.' read -ra VERSION_PARTS <<< "$current_version"
  local major=${VERSION_PARTS[0]}
  local minor=${VERSION_PARTS[1]}
  local patch=${VERSION_PARTS[2]}
  
  case $version_type in
    major)
      major=$((major + 1))
      minor=0
      patch=0
      ;;
    minor)
      minor=$((minor + 1))
      patch=0
      ;;
    patch)
      patch=$((patch + 1))
      ;;
    *)
      echo "Error: Invalid version type. Use major, minor, or patch" >&2
      exit 1
      ;;
  esac
  
  echo "${major}.${minor}.${patch}"
}

# Get current version from root package.json
CURRENT_VERSION=$(node -p "require('./package.json').version")
NEW_VERSION=$(bump_version "$CURRENT_VERSION" "$VERSION_TYPE")

echo -e "${GREEN}Bumping version from ${CURRENT_VERSION} to ${NEW_VERSION}${NC}"

# Files to update
FILES=(
  "package.json"
  "apps/web/package.json"
  "apps/api/package.json"
)

# Update root and app versions
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    # Use node to update JSON (preserves formatting better)
    node -e "
      const fs = require('fs');
      const pkg = JSON.parse(fs.readFileSync('$file', 'utf8'));
      pkg.version = '$NEW_VERSION';
      fs.writeFileSync('$file', JSON.stringify(pkg, null, 2) + '\n');
    "
    echo -e "${GREEN}✓${NC} Updated $file"
  fi
done

# Update published packages (only if they have version field)
find packages -name "package.json" -type f | while read -r file; do
  if grep -q '"version"' "$file" && ! grep -q '"private":\s*true' "$file"; then
    node -e "
      const fs = require('fs');
      const pkg = JSON.parse(fs.readFileSync('$file', 'utf8'));
      if (pkg.version) {
        pkg.version = '$NEW_VERSION';
        fs.writeFileSync('$file', JSON.stringify(pkg, null, 2) + '\n');
        console.log('Updated $file');
      }
    " 2>/dev/null || true
  fi
done

echo -e "${GREEN}Version bumped to ${NEW_VERSION}${NC}"
echo "NEW_VERSION=$NEW_VERSION" >> $GITHUB_ENV || true

