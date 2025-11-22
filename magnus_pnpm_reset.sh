#!/bin/bash
set -e

echo "🔵 Magnus PNPM Reset & Build Script Starting..."
echo "---------------------------------------------"

### COLORS ###
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
NC="\033[0m" # No Color

### 1. CHECK PNPM VERSION ###
echo -e "${YELLOW}🔍 Checking current pnpm version...${NC}"
CURRENT=$(pnpm --version || echo "0")
echo "Current pnpm: $CURRENT"

### 2. UPDATE PNPM IF NEEDED ###
TARGET="9.15.4"

if [ "$CURRENT" != "$TARGET" ]; then
  echo -e "${YELLOW}⬆️ Updating pnpm to $TARGET...${NC}"
  npm install -g pnpm@$TARGET --force
else
  echo -e "${GREEN}✔ pnpm already at $TARGET${NC}"
fi

### 3. ENABLE COREPACK ###
echo -e "${YELLOW}🔧 Enabling corepack...${NC}"
corepack enable || true

### 4. CLEAN INSTALL ###
echo -e "${YELLOW}🧹 Cleaning node_modules and lockfile...${NC}"
rm -rf node_modules || true
rm -rf pnpm-lock.yaml || true

echo -e "${YELLOW}📦 Installing dependencies (clean)...${NC}"
pnpm install

### 5. VERIFY WORKSPACE ###
echo -e "${YELLOW}📚 Verifying workspace layout...${NC}"
pnpm ls --depth 0 || true

### 6. FULL BUILD ###
echo -e "${YELLOW}🏗 Running full root build...${NC}"
pnpm build || true

### 7. INDIVIDUAL BUILDS ###
echo -e "${YELLOW}🏭 Building all package scopes...${NC}"
pnpm --filter "./packages/*" build || true
pnpm --filter "./apps/*" build || true
pnpm --filter @magnus-flipper-ai/web build || true

### 8. GIT COMMIT ###
echo -e "${YELLOW}📝 Committing changes...${NC}"

BRANCH="claude/fix-cicd-pipeline-01FBNa6zUsM8QKkQdC8GfhRW"

git add . || true
git commit -m "fix: Standardize pnpm version to 9.15.4 across all configs" || true

echo -e "${YELLOW}⬆️ Pushing to branch $BRANCH...${NC}"
git push -u origin $BRANCH || true

echo -e "${GREEN}🎉 DONE — Magnus PNPM Reset Complete${NC}"

