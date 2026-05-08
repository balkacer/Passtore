#!/usr/bin/env bash
# Carpeta desempaquetada para Firefox: about:debugging → Cargar complemento temporal
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/dist/firefox-unpacked"
mkdir -p "$OUT"
cp "$ROOT/background.js" "$ROOT/content.js" "$ROOT/popup.html" "$ROOT/popup.js" "$OUT/"
cp "$ROOT/manifest.firefox.json" "$OUT/manifest.json"
echo "Load temporary add-on: $OUT/manifest.json"
