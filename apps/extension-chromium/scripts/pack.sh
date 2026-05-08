#!/usr/bin/env bash
# Empaqueta archivos MV3 para Chrome Web Store / Edge Add-ons (Linux / macOS / Git Bash).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
VER="$(node -p "JSON.parse(require('fs').readFileSync('manifest.json','utf8')).version")"
mkdir -p dist
ZIP="dist/passtore-chromium-v${VER}.zip"
rm -f "$ZIP"
zip -j "$ZIP" manifest.json background.js content.js popup.html popup.js
echo "Created $ZIP"
