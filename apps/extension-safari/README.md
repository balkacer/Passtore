# Passtore — Safari Web Extension (host Xcode)

Este directorio **no duplica** el código MV3: la fuente sigue siendo **`apps/extension-chromium`**.

Aquí viven solo:

- **`scripts/packager.sh`** — en **macOS**, llama a `xcrun safari-web-extension-packager` y escribe **`generated/`** (gitignored).
- Punto de entrada documental: **[`docs/EXTENSION_SAFARI.md`](../../docs/EXTENSION_SAFARI.md)** (Oleada **E2**).

Desde la raíz del monorepo (solo macOS):

```bash
./apps/extension-safari/scripts/packager.sh
```

Windows: el packager de Apple **no** corre aquí; usa una Mac, una VM macOS o un job CI `macos-latest`.
