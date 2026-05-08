#!/usr/bin/env bash
# Genera proyecto Xcode + app host Safari desde apps/extension-chromium (solo macOS).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SAFARI_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MONOREPO_ROOT="$(cd "$SAFARI_ROOT/../.." && pwd)"
EXT_SRC="$MONOREPO_ROOT/apps/extension-chromium"
OUT="$SAFARI_ROOT/generated"

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "safari-web-extension-packager requires macOS + Xcode." >&2
  exit 1
fi

if [[ ! -f "$EXT_SRC/manifest.json" ]]; then
  echo "Missing extension source: $EXT_SRC/manifest.json" >&2
  exit 1
fi

TOOLARGS=(safari-web-extension-packager)
if ! xcrun --find safari-web-extension-packager &>/dev/null; then
  if xcrun --find safari-web-extension-converter &>/dev/null; then
    TOOLARGS=(safari-web-extension-converter)
    echo "Using legacy safari-web-extension-converter" >&2
  else
    echo "Install Xcode Command Line Tools / full Xcode (safari-web-extension-packager)." >&2
    exit 1
  fi
fi

BUNDLE_ID="${PASSTORE_SAFARI_BUNDLE_ID:-com.passtore.safari.host}"
APP_NAME="${PASSTORE_SAFARI_APP_NAME:-PasstoreSafariHost}"

rm -rf "$OUT"
mkdir -p "$OUT"

xcrun "${TOOLARGS[@]}" "$EXT_SRC" \
  --project-location "$OUT" \
  --app-name "$APP_NAME" \
  --bundle-identifier "$BUNDLE_ID" \
  --swift \
  --copy-resources \
  --macos-only \
  --no-open \
  --no-prompt \
  --force

echo "Xcode project output: $OUT"
