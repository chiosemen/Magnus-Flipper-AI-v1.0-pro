#!/usr/bin/env bash
#
# Magnus Namespace Fortress v4
# Hard-wired for:
#   /Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro
#
# Goals:
#   - Enforce @magnus-flipper-ai/* namespace across ALL workspace packages
#   - Fix package.json names + deps
#   - Normalize imports/exports
#   - Validate pnpm workspace + turbo config
#   - Run install + build checks
#   - Optionally auto-commit on a new branch
#
# Usage:
#   ./magnus_namespace_fortress_v4.sh           # full run + auto git commit
#   ./magnus_namespace_fortress_v4.sh --dry-run # only show actions, no writes/commit
#   ./magnus_namespace_fortress_v4.sh --no-git  # do changes but do NOT create branch/commit
#

set -euo pipefail

ROOT="/Users/chinyeosemene/Developer/Magnus-Flipper-AI-v1.0-pro"
SCOPE="@magnus-flipper-ai"
BACKUP_DIR="$ROOT/.magnus_backups"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"

DRY_RUN=0
NO_GIT=0

for arg in "$@"; do
  case "$arg" in
    --dry-run)
      DRY_RUN=1
      ;;
    --no-git)
      NO_GIT=1
      ;;
    *)
      echo "Unknown argument: $arg"
      echo "Usage: $0 [--dry-run] [--no-git]"
      exit 1
      ;;
  esac
done

cd "$ROOT"

echo "========================================================"
echo "🏰 Magnus Namespace Fortress v4"
echo " Root:   $ROOT"
echo " Scope:  $SCOPE"
echo " Dry run: $DRY_RUN  | No Git: $NO_GIT"
echo "========================================================"
echo

if [[ ! -d "$ROOT" ]]; then
  echo "❌ Root directory not found: $ROOT"
  exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "❌ pnpm not found in PATH"
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "❌ node not found in PATH"
  exit 1
fi

# ---------------------------------------------------------
# 1) GIT SAFETY & BACKUP
# ---------------------------------------------------------
if (( DRY_RUN )); then
  echo "🔍 DRY RUN MODE: No files will be modified, no git changes."
else
  echo "🧷 Checking git status..."
  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    if [[ -n "$(git status --porcelain)" ]]; then
      echo "⚠️  Working tree is not clean."
      echo "    Fortress v4 will still proceed but changes will stack on top."
    else
      echo "✅ Working tree is clean."
    fi
  else
    echo "⚠️  Not inside a git repo. Git features will be skipped."
    NO_GIT=1
  fi

  echo "📦 Creating backup snapshot..."
  mkdir -p "$BACKUP_DIR"
  BACKUP_TAR="$BACKUP_DIR/namespace_v4_backup_${TIMESTAMP}.tar.gz"
  tar -czf "$BACKUP_TAR" \
    --exclude='node_modules' \
    --exclude='.turbo' \
    --exclude='.next' \
    --exclude='dist' \
    --exclude='.expo' \
    --exclude='.pnpm' \
    --exclude='.magnus_backups' \
    .
  echo "   ➜ Backup created at: $BACKUP_TAR"
fi

# ---------------------------------------------------------
# 2) IGNORE RULES
# ---------------------------------------------------------
IGNORE_DIRS=("node_modules" ".next" "dist" "build" ".expo" ".turbo" ".pnpm" ".magnus_backups")

should_skip() {
  local path="$1"
  for dir in "${IGNORE_DIRS[@]}"; do
    if [[ "$path" == *"/$dir/"* ]] || [[ "$path" == *"/$dir/"* ]]; then
      return 0
    fi
  done
  return 1
}

# ---------------------------------------------------------
# 3) PACKAGE.JSON NORMALIZER (names + deps)
# ---------------------------------------------------------
update_package_json() {
  local file="$1"

  node <<'NODE' "$file" "$SCOPE" "$DRY_RUN"
const fs = require('fs');
const path = process.argv[2];
const scope = process.argv[3];
const dry = process.argv[4] === '1';
const p = require('path');

let data;
try {
  data = JSON.parse(fs.readFileSync(path, 'utf8'));
} catch (e) {
  console.error(`❌ Failed to parse JSON: ${path}`, e.message);
  process.exit(1);
}

const dirName = p.basename(p.dirname(path));
const baseName = (() => {
  if (data.name?.startsWith(scope + '/')) return data.name.split('/')[1];
  if (data.name?.startsWith('@')) return data.name.split('/')[1];
  return data.name || dirName;
})();

const oldName = data.name;
data.name = `${scope}/${baseName}`;

const fixDeps = (obj) => {
  if (!obj || typeof obj !== 'object') return;
  for (const key of Object.keys(obj)) {
    if (key.startsWith('@magnus/') || key.startsWith('@magnus-flipper/')) {
      const newKey = key.replace(/^@magnus(-flipper)?\//, `${scope}/`);
      if (newKey !== key) {
        obj[newKey] = obj[key];
        delete obj[key];
      }
    }
    const val = obj[key];
    if (typeof val === 'string' && (val.includes('@magnus/') || val.includes('@magnus-flipper/'))) {
      obj[key] = val.replace(/@magnus(-flipper)?\//g, `${scope}/`);
    }
  }
};

fixDeps(data.dependencies);
fixDeps(data.devDependencies);
fixDeps(data.peerDependencies);
fixDeps(data.optionalDependencies);

if (dry) {
  console.log(`[DRY] package.json: ${path}`);
  console.log(`     name: ${oldName} -> ${data.name}`);
} else {
  fs.writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`📝 Updated package.json: ${path} (name: ${oldName} -> ${data.name})`);
}
NODE
}

# ---------------------------------------------------------
# 4) IMPORT / EXPORT REWRITER
# ---------------------------------------------------------
update_imports() {
  local file="$1"
  if should_skip "$file"; then return; fi

  if (( DRY_RUN )); then
    if grep -qE '@magnus(-flipper)?/' "$file"; then
      echo "[DRY] imports: $file"
    fi
  else
    if grep -qE '@magnus(-flipper)?/' "$file"; then
      perl -0pi -e 's/@magnus(-flipper)?\//@magnus-flipper-ai\//g' "$file"
      echo "🔧 Rewrote imports in: $file"
    fi
  fi
}

# ---------------------------------------------------------
# 5) WORKSPACE + TURBO VALIDATORS (if scripts exist)
# ---------------------------------------------------------
run_helper_if_exists() {
  local script_path="$1"
  local label="$2"

  if [[ -f "$script_path" ]]; then
    echo "🧪 Running $label ($script_path)..."
    if (( DRY_RUN )); then
      echo "   [DRY] Would run: node $script_path"
    else
      node "$script_path"
    fi
  else
    echo "ℹ️  Skipping $label (not found at $script_path)"
  fi
}

# ---------------------------------------------------------
# 6) MAIN EXECUTION
# ---------------------------------------------------------

echo
echo "🔧 Phase 1: Normalize package.json namespaces..."
while IFS= read -r pkg; do
  update_package_json "$pkg"
done < <(
  find "$ROOT" -name package.json -type f \
    ! -path "*/node_modules/*" \
    ! -path "*/.next/*" \
    ! -path "*/dist/*" \
    ! -path "*/.turbo/*" \
    ! -path "*/.expo/*" \
    ! -path "*/.pnpm/*" \
    ! -path "*/build/*" \
    ! -path "*/.magnus_backups/*"
)

echo
echo "🔧 Phase 2: Rewrite imports/exports to @magnus-flipper-ai/*..."
while IFS= read -r src; do
  update_imports "$src"
done < <(
  find "$ROOT" -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.mjs" -o -name "*.cjs" \) \
    ! -path "*/node_modules/*" \
    ! -path "*/.next/*" \
    ! -path "*/dist/*" \
    ! -path "*/.turbo/*" \
    ! -path "*/.expo/*" \
    ! -path "*/.pnpm/*" \
    ! -path "*/build/*" \
    ! -path "*/.magnus_backups/*"
)

echo
echo "🧪 Phase 3: Workspace + Turbo config validation..."
run_helper_if_exists "./scripts/workspace-fixer.js" "workspace-fixer"
run_helper_if_exists "./scripts/turbo-fortify-v3.js" "turbo-fortify-v3"
run_helper_if_exists "./scripts/namespace-lint-v3.js" "namespace-lint-v3"

if (( DRY_RUN )); then
  echo
  echo "✅ DRY RUN COMPLETE – no files changed, no installs, no git actions."
  exit 0
fi

echo
echo "📦 Phase 4: pnpm install + validation..."
pnpm install

echo
echo "🔐 Phase 5: Frozen lockfile validation..."
pnpm install --frozen-lockfile

echo
echo "🚀 Phase 6: Turbo build sanity check..."
if [[ -f "$ROOT/turbo.json" ]]; then
  pnpm turbo run build || {
    echo "❌ turbo build failed after namespace migration."
    echo "   You can restore from backup: $BACKUP_TAR"
    exit 1
  }
else
  echo "ℹ️  No turbo.json found, skipping turbo build."
fi

# ---------------------------------------------------------
# 7) GIT BRANCH + COMMIT
# ---------------------------------------------------------
if (( NO_GIT )); then
  echo
  echo "ℹ️  NO_GIT flag set or git not available – skipping branch/commit."
  echo "✅ Namespace Fortress v4 finished WITHOUT git commit."
  exit 0
fi

if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo
  echo "🌿 Phase 7: Git branch + commit..."
  git checkout -B namespace-fortress-v4
  git add .
  if git diff --cached --quiet; then
    echo "ℹ️  No staged changes to commit after namespace run."
  else
    git commit -m "chore: namespace fortress v4 – enforce @magnus-flipper-ai scope"
    echo "✅ Committed on branch: namespace-fortress-v4"
  fi
else
  echo "ℹ️  Not inside a git repo – skipping git actions."
fi

echo
echo "========================================================"
echo "✅ Namespace Fortress v4 complete."
echo "   Backup:  $BACKUP_TAR"
echo "   Branch:  namespace-fortress-v4 (if git enabled)"
echo "========================================================"
