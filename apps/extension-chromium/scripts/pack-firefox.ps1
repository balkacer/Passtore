# Empaqueta MV3 para Firefox (mismo JS/HTML que Chromium; manifest con bloque gecko).
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root
$mfPath = Join-Path $Root 'manifest.firefox.json'
if (-not (Test-Path $mfPath)) {
  throw "Missing manifest.firefox.json"
}
$manifest = Get-Content $mfPath -Raw | ConvertFrom-Json
$ver = $manifest.version
$dist = Join-Path $Root 'dist'
New-Item -ItemType Directory -Force -Path $dist | Out-Null
$staging = Join-Path $dist 'firefox-build'
if (Test-Path $staging) {
  Remove-Item -Recurse -Force $staging
}
New-Item -ItemType Directory -Force -Path $staging | Out-Null

Copy-Item -LiteralPath (Join-Path $Root 'background.js') -Destination $staging
Copy-Item -LiteralPath (Join-Path $Root 'content.js') -Destination $staging
Copy-Item -LiteralPath (Join-Path $Root 'popup.html') -Destination $staging
Copy-Item -LiteralPath (Join-Path $Root 'popup.js') -Destination $staging
Copy-Item -LiteralPath $mfPath -Destination (Join-Path $staging 'manifest.json')

$zip = Join-Path $dist "passtore-firefox-v$ver.zip"
if (Test-Path $zip) {
  Remove-Item $zip
}
Compress-Archive -Path (Join-Path $staging '*') -DestinationPath $zip -CompressionLevel Optimal -Force
Remove-Item -Recurse -Force $staging
Write-Host "Created $zip"
