# Decisiones de arquitectura (índice)

Registro vivo de decisiones importantes. Los detalles extensos viven en ADRs o en `ARCHITECTURE.md`.

| ID | Tema | Decisión | Estado |
|----|------|----------|--------|
| D1 | Filosofía producto | Local-first, ciphertext-only en servidor, sync opcional | Aceptada |
| D2 | Almacenamiento local | **SQLite** como default (ver STORAGE_EVALUATION.md) | Propuesta |
| D3 | Cifrado datos | AES-256-GCM objetivo; derivación Argon2id para clave maestra | En migración desde MVP |
| D4 | Sync | Eventos incrementales + WebSocket notify + REST catch-up | Diseño |
| D5 | Conflictos | Version por entidad + detección + UI merge; LWW solo como fallback documentado | Diseño |
| D6 | Autofill | Motor de matching local + extensiones nativas por plataforma | Diseño |
| D7 | Monorepo | `apps/`, `packages/`, `services/` — migración gradual desde layout actual | En curso |
| D8 | Passkeys | Autenticación de cuenta y enroll de dispositivo; no sustituye DEK por defecto | Aceptada |
| D9 | Sync servidor | Eventos con `ciphertext_payload` + cursor `(created_at,id)`; dispositivos por `devicePublicId` | Aceptada |
| D10 | Tiempo real | Socket.IO `/sync` + hint `vault:changed`; datos vía REST pull | Aceptada |
| D11 | Escritorio empaquetado | Shell con **Tauri 2** empaquetando `apps/web`; Electron como alternativa si no hay capacidad Rust | Aceptada |

## ADRs

- [ADR-001: SQLite para vault local](./adr/ADR-001-sqlite-vault.md)
- [ADR-002: Tauri vs Electron — shell de escritorio](./adr/ADR-002-tauri-desktop-shell.md)
