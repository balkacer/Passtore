# Build from monorepo root: docker compose build web (context `.`)
FROM node:22-alpine AS builder
WORKDIR /app

COPY packages/core ./packages/core
COPY packages/crypto-contract ./packages/crypto-contract
COPY packages/vault-crypto ./packages/vault-crypto
COPY apps/web ./apps/web

WORKDIR /app/apps/web
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm ci
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
