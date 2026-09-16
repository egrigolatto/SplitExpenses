# syntax=docker/dockerfile:1

# ── Stage base: Node 24 + pnpm (Debian slim → glibc → prebuilds de argon2 ok) ──
FROM node:24-slim AS base
RUN npm install -g pnpm@11.15.1
WORKDIR /app

# ── Stage build: instala todas las deps y compila TypeScript a dist/ ──
FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY tsconfig.json ./
COPY src ./src
RUN pnpm build

# ── Stage prod-deps: solo dependencias de producción ──
# --ignore-scripts: saltea el "prepare: husky" del package root (husky es devDep y no existe acá).
# Es seguro: argon2 trae prebuilds linux-x64 (.glibc.node) que se cargan en runtime, no en install.
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# ── Stage dev: imagen para desarrollar con hot reload (tiene devDeps) ──
FROM build AS dev
CMD ["pnpm", "dev"]

# ── Stage prod: imagen final mínima para deploy ──
FROM base AS prod
ENV NODE_ENV=production
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY drizzle ./drizzle
COPY scripts ./scripts
COPY package.json ./
USER node
EXPOSE 3000
CMD ["sh", "-c", "node scripts/migrate.js && exec node dist/server.js"]
