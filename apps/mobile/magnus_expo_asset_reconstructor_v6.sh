#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-normal}" # normal | optimize
PROJECT_ROOT="$(pwd)"
ASSETS_DIR="${PROJECT_ROOT}/assets"
BACKUP_DIR="${ASSETS_DIR}/_v6_backup_$(date +%Y%m%d_%H%M%S)"
BRANDING_DIR="${ASSETS_DIR}/branding"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔥 MAGNUS EXPO ASSET RECONSTRUCTOR v6"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📁 Project: ${PROJECT_ROOT}"
echo "🖼  Assets: ${ASSETS_DIR}"
echo "🎚 Mode:    ${MODE}"
echo

if [ ! -d "${ASSETS_DIR}" ]; then
  echo "❌ ERROR: assets/ directory not found at ${ASSETS_DIR}"
  echo "   Run this script from the mobile folder."
  exit 1
fi

# -----------------------------------------------------
# 1. Backup current assets
# -----------------------------------------------------
echo "📦 Creating backup of current assets…"
mkdir -p "${BACKUP_DIR}"

ASSET_LIST=(
  "icon.png"
  "adaptive-icon.png"
  "splash.png"
  "notification.png"
  "notification-icon.png"
  "favicon.png"
)

for f in "${ASSET_LIST[@]}"; do
  if [ -f "${ASSETS_DIR}/${f}" ]; then
    cp "${ASSETS_DIR}/${f}" "${BACKUP_DIR}/${f}"
    echo "  ✔ Backed up ${f} → ${BACKUP_DIR}/${f}"
  else
    echo "  ⚠  ${f} not found (skipping backup for this file)"
  fi
done

echo "✅ Backup complete → ${BACKUP_DIR}"
echo

# -----------------------------------------------------
# 2. Optional branding injection
# -----------------------------------------------------
echo "🎨 Branding check…"
if [ -d "${BRANDING_DIR}" ]; then
  echo "📁 Found branding directory: ${BRANDING_DIR}"
  for f in "${ASSET_LIST[@]}"; do
    if [ -f "${BRANDING_DIR}/${f}" ]; then
      cp "${BRANDING_DIR}/${f}" "${ASSETS_DIR}/${f}"
      echo "  ✔ Applied branded ${f} from branding/${f}"
    fi
  done
else
  echo "ℹ  No branding folder found at assets/branding — keeping existing visuals."
fi
echo

# -----------------------------------------------------
# 3. Validate PNG signatures
# -----------------------------------------------------
echo "🔍 Validating PNG signatures…"

function check_png() {
  local file="$1"
  if [ ! -f "${file}" ]; then
    echo "  ⚠  Missing file: ${file}"
    return 0
  fi

  if command -v file >/dev/null 2>&1; then
    local out
    out="$(file "${file}" || true)"
    if echo "${out}" | grep -q "PNG image data"; then
      echo "  ✔ PNG OK: ${file}"
    else
      echo "  ❌ WARNING: ${file} is not a valid PNG (file says: ${out})"
    fi
  else
    echo "  ℹ  'file' command not available; skipping deep check for ${file}"
  fi
}

for f in "${ASSET_LIST[@]}"; do
  check_png "${ASSETS_DIR}/${f}"
done

echo

# -----------------------------------------------------
# 4. Optional optimization (macOS sips)
# -----------------------------------------------------
if [ "${MODE}" = "optimize" ]; then
  echo "⚙️  Optimization mode: trying to lightly recompress PNGs with sips…"
  if command -v sips >/dev/null 2>&1; then
    for f in "${ASSET_LIST[@]}"; do
      FILEPATH="${ASSETS_DIR}/${f}"
      if [ -f "${FILEPATH}" ]; then
        echo "  🔧 Optimizing ${f}…"
        # sips re-writes the PNG; this is gentle and safe on macOS
        sips -s format png "${FILEPATH}" >/dev/null 2>&1 || \
          echo "    ⚠  sips had trouble with ${f}, leaving as-is."
      fi
    done
    echo "✅ Optimization pass complete."
  else
    echo "ℹ  'sips' not found (non-macOS?) — skipping optimization."
  fi
  echo
fi

# -----------------------------------------------------
# 5. Ensure app.json points to these assets
# -----------------------------------------------------
if [ -f "${PROJECT_ROOT}/app.json" ]; then
  echo "🧩 Normalizing app.json asset paths…"
  node <<'EOF'
const fs = require('fs');
const path = require('path');

const appJsonPath = path.join(process.cwd(), 'app.json');
if (!fs.existsSync(appJsonPath)) {
  console.log('  ⚠ app.json not found, skipping.');
  process.exit(0);
}

const raw = fs.readFileSync(appJsonPath, 'utf8');
let json;
try {
  json = JSON.parse(raw);
} catch (e) {
  console.error('  ❌ Failed to parse app.json as JSON:', e.message);
  process.exit(1);
}

json.expo = json.expo || {};
json.expo.icon = './assets/icon.png';
json.expo.splash = json.expo.splash || {};
json.expo.splash.image = './assets/splash.png';
json.expo.splash.backgroundColor = json.expo.splash.backgroundColor || '#000000';

json.expo.ios = json.expo.ios || {};
json.expo.ios.icon = './assets/icon.png';

json.expo.android = json.expo.android || {};
json.expo.android.adaptiveIcon = json.expo.android.adaptiveIcon || {};
json.expo.android.adaptiveIcon.foregroundImage = './assets/adaptive-icon.png';
json.expo.android.adaptiveIcon.backgroundColor =
  json.expo.android.adaptiveIcon.backgroundColor || '#000000';

json.expo.android.notification = json.expo.android.notification || {};
json.expo.android.notification.icon = './assets/notification.png';

fs.writeFileSync(appJsonPath, JSON.stringify(json, null, 2));
console.log('  ✔ app.json updated with normalized asset paths.');
EOF
else
  echo "ℹ  app.json not found — assuming app.config.js is handling config."
fi

echo

# -----------------------------------------------------
# 6. Clean prebuild for iOS + Android
# -----------------------------------------------------
echo "🏗  Running Expo prebuild (ios)…"
pnpm expo prebuild --clean --platform ios

echo
echo "🏗  Running Expo prebuild (android)…"
pnpm expo prebuild --clean --platform android

echo
echo "✅ v6 complete: Assets validated, branding applied (if present),"
echo "   config normalized, and prebuild succeeded for both platforms."
echo "📦 Backup of previous assets: ${BACKUP_DIR}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔥 MAGNUS EXPO ASSET RECONSTRUCTOR v6 — DONE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
