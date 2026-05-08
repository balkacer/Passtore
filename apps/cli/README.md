# `@passtore/cli` (`apps/cli`)

CLI Node: **cofre** (`/credentials` con el mismo cifrado AES que web/móvil), sync opaca (`GET /sync/events`) y dispositivos (`GET /devices`). Los blobs de sync siguen **opacos** en servidor; las contraseñas del cofre se cifran **antes** de enviarlas al API (`PASSTORE_VAULT_KEY`).

## Requisitos

- Node **18+** (`fetch` global).
- JWT de usuario en **`PASSTORE_TOKEN`**.
- **`PASSTORE_VAULT_KEY`**: misma clave/material del cofre que en la app (necesaria para `vault add`, `vault edit` con contraseña y `vault show --reveal`).
- API en **`PASSTORE_API_BASE_URL`** (default `http://localhost:3000`).

## Build

```bash
cd apps/cli
npm install
npm run build
```

## Tests (contrato cifrado con web/móvil)

```bash
npm run test
npm run test -- src/tests/unit/encryption.contract.test.ts
```

Binario: `node dist/cli.js` o, tras `npm link` desde esta carpeta, comando **`passtore`**.

## Interfaz interactiva (TUI)

Modo “app” en la terminal con **[Ink](https://github.com/vadimdemedes/ink)** (React): menús con flechas, cabecera tipo navegador (URL + estado API/cofre), formularios por pasos.

| Entrada | Comportamiento |
|--------|----------------|
| `passtore` sin argumentos en una **TTY** | Abre la UI |
| `passtore ui` · `passtore -i` · `passtore --interactive` | Igual (sin TTY: mensaje de error) |
| Sin argumentos **sin** TTY (CI, pipe) | Muestra ayuda y código de salida 1 |

Atajos: **↑↓** mover · **Enter** confirmar · **Esc** atrás · **Ctrl+C** salir.

## Comandos

### Password (generador y utilidades)

Misma lógica que web/móvil (`apps/web/src/lib/passwordGenerator.ts`). No requiere API salvo `duplicate`.

| Comando | Descripción |
|---------|-------------|
| `passtore password generate [--length N] [--no-uppercase] [--no-lowercase] [--no-numbers] [--no-symbols] [--allow-repeated] [--allow-ambiguous] [--count N] [--copy] [--json]` | Genera una o más contraseñas; `--copy` al portapapeles (Windows/macOS/Linux con `xclip`/`wl-copy`). |
| `passtore password strength [--json] [--stdin] [contraseña]` | Puntuación 0–100 y etiqueta (`weak` … `strong`). Sin texto, lee una línea de stdin. |
| `passtore password duplicate [--exclude-id uuid] [--password \| --password-stdin]` | ¿Ya existe en el cofre? Requiere token + vault key. Código de salida **2** si es duplicado. |

### Vault (contraseñas)

| Comando | Descripción |
|---------|-------------|
| `passtore vault list [--json]` | Lista credenciales (sin descifrar). |
| `passtore vault show <id> [--json] [--reveal]` | Detalle; `--reveal` muestra contraseña y notas en claro (requiere vault key). |
| `passtore vault add … [--password … \| --password-stdin \| --generate [--gen-length N] …]` | Crea entrada; `--generate` usa el generador integrado (flags `--gen-*` como en la tabla de password). |
| `passtore vault edit <id> …` | Igual convención de contraseña / `--generate`. |
| `passtore vault delete <id>` | Elimina la credencial. |

### Sync y dispositivos

| Comando | Descripción |
|---------|-------------|
| `passtore sync pull [--limit N] [--cursor C]` | Una página de eventos; stdout JSON con `nextCursor`. |
| `passtore sync backup [--out ruta] [--limit N]` | Pagina todos los eventos y guarda JSON (backup opaco). |
| `passtore devices list` | Lista dispositivos registrados (JSON). |

Los tipos de sync están en `src/types.ts` (alineados con `packages/core/src/sync.ts` cuando aplique).

## Ejemplo

```bash
set PASSTORE_TOKEN=eyJhbG...
set PASSTORE_VAULT_KEY=tu-clave-del-cofre
npm run build --prefix apps/cli
node apps/cli/dist/cli.js vault list
node apps/cli/dist/cli.js password generate --length 24 --copy
node apps/cli/dist/cli.js password strength "Aa1!xxxxxxxx"
echo miPasswordSeguro | node apps/cli/dist/cli.js vault add --alias GitHub --platform github.com --login yo@correo --password-stdin
node apps/cli/dist/cli.js vault add --alias X --platform Y --login Z --generate --gen-length 20
```

Unix: `export PASSTORE_TOKEN=...` y `export PASSTORE_VAULT_KEY=...`
