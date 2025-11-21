#!/usr/bin/env bash
set -euo pipefail

ROOT="/Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro"
cd "$ROOT"

DRY_RUN=0
if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=1
  echo "🔍 Dry run mode: no files will be written"
fi

SCOPE="@magnus-flipper-ai"
IGNORE_DIRS=("node_modules" ".next" "dist" "build" ".expo" ".turbo" ".pnpm" ".magnus_backups")

should_skip() {
  local path="$1"
  for dir in "${IGNORE_DIRS[@]}"; do
    if [[ "$path" == *"/$dir"* ]]; then
      return 0
    fi
  done
  return 1
}

update_package_json() {
  local file="$1"
  node <<'NODE' "$file" "$SCOPE" "$DRY_RUN"
const fs = require('fs');
const path = process.argv[2];
const scope = process.argv[3];
const dry = process.argv[4] === '1';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

const baseName = (() => {
  if (data.name?.startsWith(scope + '/')) return data.name.split('/')[1];
  if (data.name?.startsWith('@')) return data.name.split('/')[1];
  return data.name || require('path').basename(require('path').dirname(path));
})();
data.name = `${scope}/${baseName}`;

const fixDeps = (obj = {}) => {
  for (const key of Object.keys(obj)) {
    if (key.startsWith('@magnus/') || key.startsWith('@magnus-flipper/')) {
      const newKey = key.replace(/^@magnus(-flipper)?\//, `${scope}/`);
      if (newKey !== key) {
        obj[newKey] = obj[key];
        delete obj[key];
      }
    }
    if (typeof obj[key] === 'string' && (obj[key].includes('@magnus/') || obj[key].includes('@magnus-flipper/'))) {
      obj[key] = obj[key]
        .replace(/@magnus(-flipper)?\//g, `${scope}/`);
    }
  }
  return obj;
};

fixDeps(data.dependencies);
fixDeps(data.devDependencies);
fixDeps(data.peerDependencies);
fixDeps(data.optionalDependencies);

if (dry) {
  console.log(`[DRY] ${path} -> name=${data.name}`);
} else {
  fs.writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf8');
}
NODE
}

update_imports() {
  local file="$1"
  if should_skip "$file"; then return; fi
  if (( DRY_RUN )); then
    perl -0pi -e 's/@magnus(-flipper)?\//@magnus-flipper-ai\//g' "$file" --dry-run >/dev/null 2>&1 || true
  else
    perl -0pi -e 's/@magnus(-flipper)?\//@magnus-flipper-ai\//g' "$file"
  fi
}

echo "🔧 Updating package.json names and scoped deps..."
while IFS= read -r pkg; do
  update_package_json "$pkg"
done < <(find "$ROOT" -name package.json -type f ! -path "*/node_modules/*" ! -path "*/.next/*" ! -path "*/dist/*" ! -path "*/.turbo/*" ! -path "*/.pnpm/*" ! -path "*/.expo/*" ! -path "*/build/*" ! -path "*/.magnus_backups/*")

echo "🔧 Updating imports in JS/TS files..."
while IFS= read -r src; do
  update_imports "$src"
done < <(find "$ROOT" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.mjs" -o -name "*.cjs" \) ! -path "*/node_modules/*" ! -path "*/.next/*" ! -path "*/dist/*" ! -path "*/.turbo/*" ! -path "*/.expo/*" ! -path "*/build/*" ! -path "*/.pnpm/*" ! -path "*/.magnus_backups/*")

if (( DRY_RUN )); then
  echo "✅ Dry run complete. No files changed."
  exit 0
fi

echo "🔄 Running pnpm install..."
pnpm install

echo "🔍 Validating pnpm list..."
pnpm list

echo "🔒 Validating frozen install..."
pnpm install --frozen-lockfile

echo "🌿 Creating branch namespace-fortress-v3 and committing..."
git checkout -B namespace-fortress-v3
git add .
git commit -m "chore: namespace fortress v3"

echo "✅ Namespace Fortress v3 complete."
