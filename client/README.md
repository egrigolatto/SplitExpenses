# Split Expenses — Client

SPA de Split Expenses: repartimiento de gastos entre personas, construida con React 19 + TypeScript + Vite. Consume la API REST de `../server`.

## Stack

| Biblioteca                            | Qué resuelve en esta app                                                                                                                                     |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| React 19                              | UI con hooks; las páginas se cargan de forma perezosa (`React.lazy`), cada ruta es su propio chunk                                                           |
| TypeScript (`strict`)                 | Tipado estricto; cero `any`                                                                                                                                  |
| Vite 8                                | Dev server con HMR y build a `dist/`; el `VITE_API_URL` se embebe al build                                                                                   |
| React Router                          | Rutas del SPA, layout con `<Outlet/>`, guardas (`ProtectedRoute`) y paginación reflejada en la URL (`?page=`)                                                |
| TanStack Query                        | Único dueño del estado del servidor: sesión (`/auth/me`), reuniones (`["meetings", {page}]`) y estadísticas (`["stats", tz]`); mutaciones invalidan la caché |
| Zustand                               | Estado de UI: el draft de reunión que viaja del formulario al resumen (`store/meeting-draft.ts`)                                                             |
| React Hook Form + @hookform/resolvers | Formularios: participantes dinámicos con `useFieldArray`, errores inline, submit validado por Zod                                                            |
| Zod                                   | Contratos declarados una vez: env, formularios y shapes de las respuestas de la API (con `z.infer` como tipos)                                               |
| Axios                                 | `services/http-client.ts`: `withCredentials`, envelope `{success,data}` validado y refresh single-flight ante 401                                            |
| Tailwind CSS 4                        | Sistema de diseño: tokens violeta/ink en `index.css` (`@theme`), tema oscuro, mobile-first                                                                   |
| Recharts                              | `/estadisticas`: barras de gasto mensual con overlay de "lo que pagaste" (`components/monthly-bar-chart.tsx`)                                                |
| Vitest + Testing Library              | Tests por comportamiento (queries por rol/label) con `services/` mockeados; jsdom por archivo (aislamiento on)                                               |

Calidad: ESLint (flat config, react-hooks + react-refresh) + Prettier; husky/lint-staged corren desde la raíz del repo.

## Setup local

1. Copiar `.env.example` a `.env` (la única variable es `VITE_API_URL`).

2. Instalar dependencias:

   ```bash
   pnpm install
   ```

3. Levantar el dev server:

   ```bash
   pnpm dev
   ```

La app queda disponible en `http://localhost:5173` y espera la API en `http://localhost:3000` (ver `../server/README.md`).

## Scripts

| Comando             | Qué hace                                             |
| ------------------- | ---------------------------------------------------- |
| `pnpm dev`          | Dev server de Vite con hot reload                    |
| `pnpm build`        | Typecheck (`tsc -b`) + build de producción a `dist/` |
| `pnpm preview`      | Sirve el build localmente                            |
| `pnpm lint`         | ESLint                                               |
| `pnpm format`       | Prettier --write                                     |
| `pnpm format:check` | Prettier --check (lo usa CI)                         |
| `pnpm test`         | Vitest run                                           |
| `pnpm test:watch`   | Vitest en modo watch                                 |

## Docker

El `Dockerfile` es multi-stage: `dev` (Node + pnpm + hot reload) y `prod` (imagen mínima `nginx:alpine` sirviendo `dist/` con fallback SPA). En el `docker-compose.yml` de la raíz:

| Comando                                       | Modo           | Qué corre                                              |
| --------------------------------------------- | -------------- | ------------------------------------------------------ |
| `docker compose --profile dev up`             | **Desarrollo** | postgres + server-dev (`:3000`) + client-dev (`:5173`) |
| `docker compose --profile prod up -d --build` | **Producción** | postgres + server (`:3000`) + nginx (`:8080`)          |

Notas:

- Las variables `VITE_*` se embeben en el bundle **al build**: en el servicio `client` de producción se pasan por `build.args`.
- `localhost:5173` ↔ `localhost:3000` son _same-site_ para el navegador (SameSite ignora el puerto), así que las cookies HttpOnly de sesión viajan bien con `withCredentials` en desarrollo y en el compose de producción (`:8080` ↔ `:3000`).
- Tras cambiar dependencias en el host, `docker compose --profile dev restart client-dev` re-sincroniza el `node_modules` del contenedor contra el lockfile.

## Estructura

```text
src/
├── components/   # componentes reutilizables (filas de participantes, tablas, listas)
├── pages/        # una pantalla por ruta
├── layouts/      # RootLayout: header + <Outlet/>
├── hooks/        # use-session (auth), use-meetings, use-stats (queries/mutaciones)
├── services/     # axios + auth/meetings/health/stats; único lugar que toca HTTP
├── store/        # Zustand: draft de reunión (UI state)
├── schemas/      # Zod: formularios + respuestas de API
├── types/        # tipos de dominio
├── routes/       # createBrowserRouter + ProtectedRoute
└── utils/        # funciones puras: cálculo del reparto, formatos
```

La lógica de cálculo del reparto vive en `src/utils/split-expenses.ts` (aritmética en centavos, mínimo de transferencias) y no depende de React ni de la red.

## Documentación

- `AGENTS.md` → convenciones y reglas para agentes/desarrollo en este directorio.
- `../docs/api-design.md` → contrato de la API (envelope, auth con cookies + refresh).
- `../docs/coding-standards.md` → estándares del repo.
