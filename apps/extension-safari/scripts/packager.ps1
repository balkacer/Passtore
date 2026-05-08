# Safari Web Extension packager runs only on macOS (Apple xcrun).
Write-Host @'
Safari Web Extension packaging requires macOS with Xcode.

From macOS:
  chmod +x apps/extension-safari/scripts/packager.sh
  ./apps/extension-safari/scripts/packager.sh

See docs/EXTENSION_SAFARI.md
'@
exit 1
