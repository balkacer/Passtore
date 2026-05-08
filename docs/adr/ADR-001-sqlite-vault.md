# ADR-001: SQLite como almacén principal del vault local

## Estado

Aceptada (propuesta inicial)

## Contexto

Passtore requiere offline-first, listados rápidos, búsqueda, cola de sync y metadatos indexables. Realm y WatermelonDB son alternativas válidas pero con distintos trade-offs.

## Decisión

Usar **SQLite** en React Native (driver mantenido activamente) como base del vault, con esquema versionado y migraciones en cliente.

## Consecuencias

**Positivas**

- Control total del esquema de `outbox` y `sync_state`.
- Consultas e índices predecibles.

**Negativas**

- Mantener migraciones en app (similar a backend).
- Cifrado file-level opcional (SQLCipher) implica binarios nativos extra.

## Referencias

- `docs/STORAGE_EVALUATION.md`
- `docs/ARCHITECTURE.md`
