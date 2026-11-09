# creator-nexus self-hosted web: Vite build with the SDK shim, served by Caddy. Build context: repository root.
FROM node:22-bookworm-slim AS build
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund --loglevel=error
COPY . .
ARG VITE_CREATOR_NEXUS_URL=""
ENV VITE_BASE44_APP_ID=6ad00af14909c671e73bb835 VITE_CREATOR_NEXUS_URL=${VITE_CREATOR_NEXUS_URL}
RUN npm run build:selfhost

FROM caddy:2.10-alpine
COPY --from=build /src/dist /srv
COPY selfhost/Caddyfile /etc/caddy/Caddyfile
