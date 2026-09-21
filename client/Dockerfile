# syntax=docker/dockerfile:1

# ── Stage base: Node 24 + pnpm ──
FROM node:24-slim AS base
RUN npm install -g pnpm@11.15.1
WORKDIR /app

# ── Stage build: instala deps y compila el bundle estático a dist/ ──
# Las variables VITE_* se embeben en el bundle durante el build:
# pasarlas con --build-arg (o args: en compose).
FROM base AS build
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY vite.config.ts vitest.config.ts index.html ./
COPY src ./src
RUN pnpm build

# ── Stage dev: imagen para desarrollar con hot reload (tiene devDeps) ──
FROM build AS dev
EXPOSE 5173
CMD ["pnpm", "dev", "--host"]

# ── Stage prod: imagen final mínima que sirve dist/ con nginx ──
FROM nginx:1.29-alpine AS prod
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
