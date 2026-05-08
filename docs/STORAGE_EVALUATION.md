# Evaluación de almacenamiento local (offline-first)

## Criterios

| Criterio | Peso |
|----------|------|
| Rendimiento en listados grandes | Alto |
| Offline-first / consultas SQL | Alto |
| Integración con sync incremental | Alto |
| Cifrado | Medio–Alto (ver nota) |
| Escalabilidad del equipo TypeScript | Alto |

## Opciones

### SQLite (`react-native-quick-sqlite` o `expo-sqlite` sin Expo → preferir **react-native-quick-sqlite** o equivalente mantenido)

**Pros**

- Consultas expresivas, índices, FTS opcional para búsqueda de título/dominio.
- Modelo mental claro para **colas outbox**, **cursors de sync**, tablas de **metadatos**.
- Ecosistema maduro; fácil migraciones versionadas (similar a Flyway en app).

**Contras**

- El “cifrado en reposo” del archivo SQLite en disco suele ser responsabilidad de **OS** (sandbox) + **cifrado de campos** en app; SQLCipher añade complejidad nativa.

**Veredicto**: **Recomendado** como almacén principal del vault para Passtore.

---

### Realm

**Pros**

- Objeto-grafo, lazy lists, buen rendimiento.

**Contras**

- Menos natural para esquemas **relacionales** de sync/outbox; licencias y bundle size; curva para equipos SQL-first.

**Veredicto**: Viable, pero **no** primera opción si priorizas SQL explícito y colas de sync.

---

### WatermelonDB

**Pros**

- Pensado para sync lazy y observables; buen fit conceptual.

**Contras**

- Más acoplamiento a su modelo; curva de adopción; stack RN debe mantenerse alineado.

**Veredicto**: Reevaluar si se adopta un **ORM de sync** completo; para control fino del protocolo propio, **SQLite + capa propia** suele ganar.

---

## Decisión sugerida

**SQLite** como fuente de verdad local + tablas:

- `credentials` — columnas cifradas / JSON cifrado por fila según diseño.
- `sync_outbox` — eventos pendientes.
- `sync_state` — cursor, reloj, hash opcional.
- `devices_local` — cache de nombre propio dispositivo.

**Cifrado**: capa de aplicación con **AES-GCM** + claves en Keychain; opcionalmente **SQLCipher** solo si threat model lo exige (instalaciones enterprise).

Ver ADR dedicado en [DECISIONS.md](./DECISIONS.md).
