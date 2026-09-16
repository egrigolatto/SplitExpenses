# Split Expenses — Server

Backend de Split Expenses: API REST construida con Express 5, TypeScript, Drizzle ORM y PostgreSQL.

## Stack

- **Runtime:** Node.js 24 + TypeScript (ESM)
- **Framework:** Express 5
- **Base de datos:** PostgreSQL + Drizzle ORM
- **Auth:** JWT (access + refresh con rotación y detección de reuso), cookies HttpOnly, Google OAuth
- **Validación:** Zod 4
- **Testing:** Vitest + Supertest
- **Logging:** pino + pino-http

## Setup local

1. Levantar PostgreSQL:

   ```bash
   docker compose up -d   # desde la raíz del repo (solo levanta la DB; ver sección Docker)
   ```

2. Instalar dependencias:

   ```bash
   pnpm install
   ```

3. Copiar `.env.example` a `.env` y completar las variables (ver tabla abajo).

4. Aplicar migraciones:

   ```bash
   pnpm db:migrate
   ```

5. Levantar el servidor en modo desarrollo:

   ```bash
   pnpm dev
   ```

La API queda disponible en `http://localhost:3000/api/v1` y la documentación Swagger en `http://localhost:3000/docs`.

## Docker

El server está contenerizado con un `Dockerfile` multi-stage (Node 24 slim, pnpm 11). En el `docker-compose.yml` de la raíz hay **dos perfiles** para el server, más el servicio `postgres` que siempre levanta:

| Comando                                       | Modo           | Qué corre                                             |
| --------------------------------------------- | -------------- | ----------------------------------------------------- |
| `docker compose up -d`                        | Solo DB        | únicamente `postgres` (los servers están en profiles) |
| `docker compose --profile dev up`             | **Desarrollo** | postgres + `pnpm db:migrate && pnpm dev` (hot reload) |
| `docker compose --profile prod up -d --build` | **Producción** | postgres + imagen mínima con migraciones + compiled   |

> Los servicios `server` y `server-dev` usan [compose profiles](https://docs.docker.com/compose/how-tos/profiles/), así que `docker compose up` sin perfil no levanta ninguno de los dos (por eso el paso 1 del setup local sigue usando la DB contenerizada sin pelearse con tu `pnpm dev`).

### Modo desarrollo

```bash
docker compose --profile dev up          # postgres + server con hot reload
docker compose --profile dev logs -f server-dev
```

- La carpeta `server/` va montada dentro del contenedor (`./server:/app`): cualquier cambio en `src/` reinicia el server solo (tsx watch).
- `node_modules` vive en un volumen nombrado (`server_node_modules`) para que convivan el `node_modules` de la imagen (Linux) con tu carpeta local, sin pisarse.
- Env: se lee `server/.env` vía `env_file`, y `DATABASE_URL` queda pisada por la del servicio (host `postgres`, no `localhost`), así que la DB contenerizada funciona sin tocar el `.env`.
- Si cambian dependencias (`package.json`), hay que reconstruir la imagen: `docker compose --profile dev build server-dev`.

### Modo producción

```bash
docker compose --profile prod up -d --build
```

- La imagen final contiene solo `dist/`, `node_modules` de producción, las migraciones y `scripts/migrate.js`; corre como usuario no-root.
- Al arrancar aplica migraciones automáticamente (`node scripts/migrate.js`, usa el migrador de `drizzle-orm`, sin `drizzle-kit`) y luego levanta `node dist/server.js`.
- Healthcheck: `/health` (compose + `depends_on` de postgres con `pg_isready`).

### Testear una imagen

```bash
curl localhost:3000/health          # liveness
curl localhost:3000/health/ready    # readiness (checa DB)
docker compose ps --all             # estado/salud de los contenedores
```

## Variables de entorno

| Variable                   | Descripción                                                                   | Ejemplo                                                      |
| -------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `NODE_ENV`                 | Entorno (`development`, `test`, `production`)                                 | `development`                                                |
| `PORT`                     | Puerto del servidor                                                           | `3000`                                                       |
| `DATABASE_URL`             | Connection string de PostgreSQL                                               | `postgres://postgres:postgres@localhost:5432/split_expenses` |
| `JWT_SECRET`               | Secreto para el token de estado del flujo Google OAuth                        | string de 32+ caracteres                                     |
| `ACCESS_TOKEN_SECRET`      | Secreto del JWT de acceso                                                     | string de 32+ caracteres                                     |
| `REFRESH_TOKEN_SECRET`     | Secreto del JWT de refresh                                                    | string de 32+ caracteres                                     |
| `ACCESS_TOKEN_EXPIRES_IN`  | Expiración del access token                                                   | `15m`                                                        |
| `REFRESH_TOKEN_EXPIRES_IN` | Expiración del refresh token                                                  | `30d`                                                        |
| `COOKIE_NAME`              | Nombre de la cookie de acceso                                                 | `access_token`                                               |
| `GOOGLE_CLIENT_ID`         | Client ID de Google OAuth                                                     |                                                              |
| `GOOGLE_CLIENT_SECRET`     | Client secret de Google OAuth                                                 |                                                              |
| `GOOGLE_REDIRECT_URI`      | URI de callback de Google OAuth                                               | `http://localhost:3000/api/v1/auth/google/callback`          |
| `FRONTEND_URL`             | URL del frontend (CORS)                                                       | `http://localhost:5173`                                      |
| `TRUST_PROXY`              | Capas de reverse proxy por delante (típicamente 1 en la nube). Vacío en local | `1`                                                          |

## Scripts

| Script             | Descripción                                     |
| ------------------ | ----------------------------------------------- |
| `pnpm dev`         | Servidor en modo watch (tsx)                    |
| `pnpm build`       | Compila TypeScript a `dist/`                    |
| `pnpm start`       | Corre el servidor compilado                     |
| `pnpm test`        | Corre la suite de tests (usa `.env.test`)       |
| `pnpm test:watch`  | Tests en modo watch                             |
| `pnpm lint`        | ESLint                                          |
| `pnpm format`      | Prettier --write                                |
| `pnpm db:generate` | Genera migraciones desde los schemas de Drizzle |
| `pnpm db:migrate`  | Aplica las migraciones                          |
| `pnpm db:studio`   | Drizzle Studio (explorar la DB)                 |

## Endpoints

Todas las respuestas exitosas siguen el contrato `{ success: true, data }`. Los errores devuelven `{ success: false, message }` (y `errors` con `field`/`message` en errores de validación).

### Auth

| Método | Ruta                    | Descripción                                         |
| ------ | ----------------------- | --------------------------------------------------- |
| POST   | `/auth/register`        | Registro con email y password                       |
| POST   | `/auth/login`           | Login con email y password                          |
| POST   | `/auth/refresh`         | Renueva el access token usando la cookie de refresh |
| POST   | `/auth/logout`          | Revoca el refresh token y limpia las cookies        |
| GET    | `/auth/me`              | Usuario autenticado                                 |
| GET    | `/auth/google`          | Redirige al flujo OAuth de Google                   |
| GET    | `/auth/google/callback` | Callback de Google OAuth                            |

### Users

| Método | Ruta        | Descripción                     |
| ------ | ----------- | ------------------------------- |
| PATCH  | `/users/me` | Actualiza el perfil del usuario |

### Meetings

| Método | Ruta            | Descripción                            |
| ------ | --------------- | -------------------------------------- |
| POST   | `/meetings`     | Crea una reunión                       |
| GET    | `/meetings`     | Lista reuniones del usuario (paginado) |
| GET    | `/meetings/:id` | Obtiene una reunión por id             |
| PATCH  | `/meetings/:id` | Actualiza una reunión                  |
| DELETE | `/meetings/:id` | Elimina una reunión                    |

`GET /meetings` acepta `page` (default 1) y `limit` (default 10, máximo 50) y devuelve:

```json
{
  "success": true,
  "data": { "items": [], "page": 1, "limit": 10, "total": 0, "totalPages": 0 }
}
```

## Health

| Método | Ruta            | Descripción                                                     |
| ------ | --------------- | --------------------------------------------------------------- |
| GET    | `/health`       | Liveness: proceso vivo (no toca dependencias)                   |
| GET    | `/health/ready` | Readiness: `SELECT 1` con timeout 2s → 503 si la DB no responde |

## Autenticación

- El login/registro setean dos cookies HttpOnly: `access_token` (JWT corto, 15m) y `access_token_refresh` (JWT largo, 30d, path `/api/v1/auth`).
- Los refresh tokens se guardan **hasheados** en la tabla `refresh_tokens`, agrupados por familia.
- Cada `POST /auth/refresh` **rota** el refresh token (revoca el anterior y emite uno nuevo en la misma familia).
- **Detección de reuso:** si se presenta un refresh token ya rotado dentro de una ventana de gracia de 10s, se re-emite el access token sin revocar la familia (protege refrescos paralelos). Fuera de la ventana, se revoca toda la familia (posible robo de token).
- `POST /auth/logout` revoca el refresh token con efecto inmediato.
- Los refresh tokens vencidos y las revocaciones de más de 30 días se purgan automáticamente al arrancar el server y cada 6 horas (job en `src/jobs/refresh-token-cleanup.ts`).

## Tests

La suite corre contra una base `split_expenses_test` (connection string en `.env.test`), creada y migrada automáticamente por `tests/global-setup.ts`.

```bash
pnpm test
```

## Deploy

Este backend está escrito como server clásico de proceso largo (pool de conexiones, job periódico in-process, graceful shutdown con `SIGTERM`). Para elegir dónde desplegar, busca un hosting que soporte **procesos Node persistentes** (web service / container); los runtimes serverless de funciones efímeras no aplican porque el cron in-process, el graceful shutdown y el rate limiting en memoria dependen de un proceso vivo.

**Base de datos:** cualquier PostgreSQL gestionado que exponga connection string con soporte de pooling (directo o vía pooler).

**Comandos del service:**

- Build: `pnpm install && pnpm build`
- Start: `node dist/server.js`
- Pre-deploy / migraciones: `pnpm db:migrate` (una vez por deploy)
- Health check: `/health/ready`

Alternativa: deployar directamente este repo con Docker (`server/Dockerfile`, target `prod`). La imagen aplica migraciones sola al arrancar y ya trae el healthcheck del compose, así que no hace falta configurar build/start en el hosting: basta con que soporte contenedores (en Render, runtime Docker requiere plan pago).

**Variables de entorno** (ver tabla arriba):

- `NODE_ENV=production`
- `DATABASE_URL` (la DB gestionada)
- `TRUST_PROXY` con el número de capas de reverse proxy por delante (lo más común: `1`; sumá una si hay CDN/proxy extra tipo Cloudflare). Vacío solo en local sin proxy.
- Secrets fuertes: `openssl rand -base64 48` para `JWT_SECRET`, `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`.
- `FRONTEND_URL` con el origin exacto del frontend desplegado (CORS con credenciales).

El runtime queda fijado por `engines.node` / `.nvmrc` (Node 24): asegurate de que el hosting respete esa versión o configurá el runtime en consecuencia.

Nota: `.env.test` (valores dummy) está versionado a propósito para que CI corra la suite sin secrets; el `.env` real nunca se pushea.

### Deploy actual: Render (plan free) + Supabase

La infraestructura está declarada como código en **`render.yaml`** (raíz del repo): [Render Blueprint](https://docs.render.com/blueprints/) crea/actualiza el servicio a partir de ese archivo. Pasos:

1. **Supabase** → crear proyecto en región **US West (Oregon)** (misma que `region: oregon` de Render). Para la connection string usar el **shared pooler en Session mode** (Connect → Connection pooling, host `aws-0-*.pooler.supabase.com`, usuario `postgres.<ref>`, puerto **5432**) y agregarle `?sslmode=require`. Razones: Render solo sale por IPv4 (la conexión directa `db.*.supabase.co` es IPv6-only; el add-on IPv4 es pago), el puerto 6543 (transaction mode) rompe sesiones (migraciones), y este server ya trae `pg.Pool` propio.
2. **Render** → New → **Blueprint** → repo, branch `develop`. Render lee `render.yaml` y pedirá una sola vez los 3 valores marcados `sync: false` (`DATABASE_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — los de Google se copian de tu `.env` local). Los 3 secrets JWT los genera Render con `generateValue: true`.
3. **Google Cloud Console** → en el OAuth client, agregar a _Authorized redirect URIs_ el URI con el dominio real: `https://<servicio>.onrender.com/api/v1/auth/google/callback`. Si el nombre final difiere del de `render.yaml`, actualizar `GOOGLE_REDIRECT_URI` en el servicio.
4. **Verificar el deploy:**

   ```bash
   curl https://<dominio>/health/ready   # → "database":true
   # Swagger: https://<dominio>/docs
   # Supabase Table Editor: __drizzle_migrations con 9 filas, users con la fila de prueba
   ```

Detalles del setup free a tener en cuenta:

- **Spin-down**: la instancia free duerme tras 15 min sin tráfico y despierta con el primer request (~1 min). El job de limpieza de refresh tokens no corre mientras duerme (se re-arrastra al arrancar: purga al boot).
- **Migraciones**: el plan free no soporta _pre-deploy command_, así que corren dentro del `startCommand` (`node scripts/migrate.js && exec node dist/server.js`): son idempotentes (si ya están aplicadas, noop). Si una migración está rota, el arranque falla y Render conserva la versión anterior. Para adelantarlas a mano: `DATABASE_URL="<pooler>" pnpm db:migrate` desde tu máquina.
- **`FRONTEND_URL`** hoy es un placeholder (`http://localhost:5173`, el schema lo exige como URL válida). Cuando se despliegue el frontend, actualizarla en `render.yaml` al origin exacto (CORS con credenciales exige coincidencia total).
- **Rate limiting en memoria**: válido para 1 instancia; si se escala a varias réplicas, el límite por IP deja de ser correcto (migrar a un store compartido).
- Si el build native no detecta pnpm: `buildCommand: corepack enable && corepack prepare pnpm@11.15.1 --activate && pnpm install --frozen-lockfile && pnpm build`.
- Si el free tier hiciera restart-loops con el healthcheck: quitar `healthCheckPath` del `render.yaml` (no afecta a la app).

## Documentación API

Swagger UI en `GET /docs`, spec OpenAPI en `GET /docs/openapi.json`.
