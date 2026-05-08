# Layout objetivo del monorepo

## Estado actual

```
Passtore/
├── apps/
│   ├── mobile/
│   └── web/
├── backend/
├── packages/
│   └── core/
├── docs/
├── docker-compose.yml
└── README.md
```

## Estado objetivo

```
Passtore/
├── apps/
│   ├── mobile/           # React Native CLI
│   └── web/              # Vite SPA
├── packages/
│   └── core/             # @passtore/core — tipos, protocolo sync
├── services/
│   └── api/              # NestJS (hoy backend/)
├── docs/
├── docker-compose.yml
├── package.json          # workspaces npm/pnpm
└── README.md
```

## Herramientas recomendadas

- **npm workspaces** o **pnpm workspaces** (una sola lockfile en raíz).
- **TypeScript project references** para `@passtore/core`.

## Metro (React Native)

Al mover a monorepo, añadir en `metro.config.js`:

- `watchFolders` apuntando a la raíz del repo.
- `resolver.nodeModulesPaths` para resolver dependencias hoisteadas.

## Docker

`docker-compose` construye el **backend** desde `./backend` y la **web** desde `./apps/web`. Cuando exista `services/api`, cambiar solo el context del servicio API en el YAML.
