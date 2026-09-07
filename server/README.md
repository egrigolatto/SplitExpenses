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
   docker compose up -d   # desde la raíz del repo
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

## Variables de entorno

| Variable                   | Descripción                                            | Ejemplo                                                      |
| -------------------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| `NODE_ENV`                 | Entorno (`development`, `test`, `production`)          | `development`                                                |
| `PORT`                     | Puerto del servidor                                    | `3000`                                                       |
| `DATABASE_URL`             | Connection string de PostgreSQL                        | `postgres://postgres:postgres@localhost:5432/split_expenses` |
| `JWT_SECRET`               | Secreto para el token de estado del flujo Google OAuth | string de 32+ caracteres                                     |
| `ACCESS_TOKEN_SECRET`      | Secreto del JWT de acceso                              | string de 32+ caracteres                                     |
| `REFRESH_TOKEN_SECRET`     | Secreto del JWT de refresh                             | string de 32+ caracteres                                     |
| `ACCESS_TOKEN_EXPIRES_IN`  | Expiración del access token                            | `15m`                                                        |
| `REFRESH_TOKEN_EXPIRES_IN` | Expiración del refresh token                           | `30d`                                                        |
| `COOKIE_NAME`              | Nombre de la cookie de acceso                          | `access_token`                                               |
| `GOOGLE_CLIENT_ID`         | Client ID de Google OAuth                              |                                                              |
| `GOOGLE_CLIENT_SECRET`     | Client secret de Google OAuth                          |                                                              |
| `GOOGLE_REDIRECT_URI`      | URI de callback de Google OAuth                        | `http://localhost:3000/api/v1/auth/google/callback`          |
| `FRONTEND_URL`             | URL del frontend (CORS)                                | `http://localhost:5173`                                      |

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

## Documentación API

Swagger UI en `GET /docs`, spec OpenAPI en `GET /docs/openapi.json`.
