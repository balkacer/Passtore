# Carpeta desempaquetada para Firefox: about:debugging → Cargar complemento temporal → manifest.json
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
$Out = Join-Path $Root 'dist/firefox-unpacked'
New-Item -ItemType Directory -Force -Path $Out | Out-Null
Copy-Item -Force (Join-Path $Root 'background.js') $Out
Copy-Item -Force (Join-Path $Root 'content.js') $Out
Copy-Item -Force (Join-Path $Root 'popup.html') $Out
Copy-Item -Force (Join-Path $Root 'popup.js') $Out
Copy-Item -Force (Join-Path $Root 'manifest.firefox.json') (Join-Path $Out 'manifest.json')
Write-Host "Load temporary add-on: $Out\manifest.json"
