# Empaqueta solo los archivos necesarios para cargar / subir a la tienda (sin README ni docs).
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root
$manifest = Get-Content (Join-Path $Root 'manifest.json') -Raw | ConvertFrom-Json
$ver = $manifest.version
$dist = Join-Path $Root 'dist'
New-Item -ItemType Directory -Force -Path $dist | Out-Null
$zip = Join-Path $dist "passtore-chromium-v$ver.zip"
if (Test-Path $zip) {
  Remove-Item $zip
}
$items = @(
  (Join-Path $Root 'manifest.json'),
  (Join-Path $Root 'background.js'),
  (Join-Path $Root 'content.js'),
  (Join-Path $Root 'popup.html'),
  (Join-Path $Root 'popup.js')
)
foreach ($p in $items) {
  if (-not (Test-Path $p)) {
    throw "Missing file: $p"
  }
}
Compress-Archive -LiteralPath $items -DestinationPath $zip -CompressionLevel Optimal -Force
Write-Host "Created $zip"
