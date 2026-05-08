#!/usr/bin/env bash
# Empaqueta MV3 para Firefox (mismo JS que Chromium; manifest.gecko vía manifest.firefox.json).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
VER="$(node -p "JSON.parse(require('fs').readFileSync('manifest.firefox.json','utf8')).version")"
mkdir -p dist
STAGING="dist/firefox-build"
rm -rf "$STAGING"
mkdir -p "$STAGING"
cp background.js content.js popup.html popup.js "$STAGING/"
cp manifest.firefox.json "$STAGING/manifest.json"
ZIP="$ROOT/dist/passtore-firefox-v${VER}.zip"
rm -f "$ZIP"
( cd "$STAGING" && zip -r "$ZIP" . )
rm -rf "$STAGING"
echo "Created $ZIP"
