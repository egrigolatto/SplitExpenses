# API Design

## Objetivo

Este documento define el contrato de comunicación entre el cliente y el servidor.

La API de Split Expenses tiene como responsabilidad principal la autenticación de usuarios y la persistencia de datos. Toda la lógica de cálculo del reparto de gastos se ejecuta en el frontend.

---

# Principios

La API seguirá los siguientes principios:

- Arquitectura REST.
- Versionado mediante URL (`/api/v1`).
- Comunicación mediante JSON.
- Autenticación mediante JWT almacenado en Cookies HttpOnly.
- Validación de todas las entradas con Zod.
- Respuestas con un formato consistente.
- Separación entre recursos públicos y privados.

---

# URL Base

```
/api/v1
```

Ejemplos

```
GET /api/v1/health
POST /api/v1/auth/login
GET /api/v1/meetings
```

---

# Formato

## Request

Todas las peticiones deberán utilizar:

```
Content-Type: application/json
```

---

## Response

Todas las respuestas devolverán JSON.

Ejemplo:

```json
{
  "success": true,
  "data": {}
}
```

---

# Autenticación

La autenticación utilizará:

- JWT
- Cookies HttpOnly
- SameSite=Lax
- Secure=true en producción

Las rutas privadas requerirán un usuario autenticado.

---

# Recursos

La API trabaja con los siguientes recursos.

## User

Representa un usuario registrado.

---

## Meeting

Representa una reunión guardada por un usuario.

Contiene:

- información general
- participantes
- resumen del gasto

---

# Endpoints

## Públicos

### Health Check (liveness)

```
GET /health
```

Descripción

Verifica que el proceso del servidor esté funcionando. No consulta dependencias (ni base de datos), por lo que es apto como liveness probe.

Respuesta

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2026-09-01T12:00:00.000Z"
  }
}
```

---

### Ready Check (readiness)

```
GET /health/ready
```

Descripción

Verifica que el servicio pueda atender tráfico: ejecuta `SELECT 1` contra PostgreSQL con un timeout de 2 segundos. Útil como readiness probe en orquestadores/healthchecks de despliegue.

Respuesta

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "database": true,
    "timestamp": "2026-09-01T12:00:00.000Z"
  }
}
```

Si la base de datos es inalcanzable, responde `503`:

```json
{
  "success": false,
  "message": "Database unavailable"
}
```

---

# Autenticación

## Registrar usuario

```
POST /auth/register
```

Body

```json
{
  "name": "Juan Pérez",
  "email": "juan@email.com",
  "password": "********"
}
```

Respuesta

```json
{
  "success": true,
  "data": {
    "id": "...",
    "name": "Juan Pérez",
    "email": "juan@email.com"
  }
}
```

---

## Login

```
POST /auth/login
```

Body

```json
{
  "email": "juan@email.com",
  "password": "********"
}
```

Respuesta

Cookie HttpOnly + usuario autenticado.

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "name": "Juan Pérez"
    }
  }
}
```

---

## Login con Google

```
GET /auth/google
```

Redirecciona al flujo OAuth.

---

## Renovar sesión (refresh)

```
POST /auth/refresh
```

Lee el refresh token desde la cookie `refresh_token` (HttpOnly). Emite un nuevo access token y **rota** el refresh token (revoca el anterior y crea uno nuevo en la misma familia).

**Reuse detection:** cada refresh pertenece a una "familia". Si un refresh token ya consumido (rotado) se presenta de nuevo:

- **Dentro de la ventana de gracia (10s):** se re-emite el access token sin revocar la familia (protege refrescos paralelos del mismo usuario, p.ej. múltiples pestañas).
- **Fuera de la ventana de gracia:** se **revoca toda la familia** (todas las sesiones del usuario quedan invalidadas) y se responde `401` — señal de que un atacante está reutilizando un token robado.

Un token revocado por **logout** siempre falla inmediatamente (no aplica ventana de gracia).

Respuesta

```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "name": "Juan Pérez" },
    "accessToken": "..."
  }
}
```

La cookie de refresh se actualiza con el nuevo token rotado en cada respuesta de refresh.

---

## Logout

```
POST /auth/logout
```

Revoca el refresh token en la base de datos y elimina ambas cookies de autenticación.

---

## Usuario autenticado

```
GET /auth/me
```

Obtiene la información del usuario autenticado.

---

# Reuniones

Todas las rutas requieren autenticación.

---

## Obtener reuniones

```
GET /meetings?page=1&limit=10
```

Devuelve las reuniones pertenecientes al usuario, paginadas y ordenadas por fecha de creación (más recientes primero).

Query params

- `page` (opcional, default `1`, mínimo `1`).
- `limit` (opcional, default `10`, mínimo `1`, máximo `50`).

Respuesta

```json
{
  "success": true,
  "data": {
    "items": [],
    "page": 1,
    "limit": 10,
    "total": 0,
    "totalPages": 0
  }
}
```

---

## Obtener una reunión

```
GET /meetings/:id
```

Obtiene una reunión específica.

---

## Crear reunión

```
POST /meetings
```

Body

```json
{
  "name": "Asado sábado",
  "meetingDate": "2026-07-29",
  "totalAmount": 180,
  "participants": [
    {
      "name": "Juan",
      "paidAmount": 100
    },
    {
      "name": "Pedro",
      "paidAmount": 40
    },
    {
      "name": "Lucas",
      "paidAmount": 40
    }
  ]
}
```

Respuesta

```json
{
  "success": true,
  "data": {
    "id": "...",
    "name": "Asado sábado"
  }
}
```

---

## Actualizar reunión

```
PATCH /meetings/:id
```

Actualiza la información de una reunión.

---

## Eliminar reunión

```
DELETE /meetings/:id
```

Elimina una reunión.

---

# Formato de respuestas

## Respuesta exitosa

```json
{
  "success": true,
  "data": {}
}
```

---

## Error

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "name",
      "message": "String must contain at least 2 character(s)"
    }
  ]
}
```

---

# Códigos HTTP

| Código | Significado           |
| ------ | --------------------- |
| 200    | OK                    |
| 201    | Created               |
| 400    | Bad Request           |
| 401    | Unauthorized          |
| 403    | Forbidden             |
| 404    | Not Found             |
| 409    | Conflict              |
| 500    | Internal Server Error |

---

# Decisiones de arquitectura

## Cálculo de gastos

La lógica de cálculo del reparto de gastos se implementará exclusivamente en el frontend.

### Motivos

- La aplicación debe funcionar sin autenticación.
- El cálculo no requiere acceso a la base de datos.
- El usuario obtiene el resultado inmediatamente.
- El backend permanece enfocado en autenticación y persistencia.

---

## Responsabilidad del backend

El backend es responsable de:

- Registrar usuarios.
- Autenticar usuarios.
- Gestionar sesiones.
- Guardar reuniones.
- Consultar reuniones.
- Actualizar reuniones.
- Eliminar reuniones.

No realiza cálculos relacionados con el reparto de gastos.

---

# Funcionalidades futuras

La API está diseñada para permitir futuras ampliaciones como:

- Compartir reuniones mediante enlaces.
- Invitaciones entre usuarios.
- Exportación de resultados.
- Estadísticas avanzadas.
- Notificaciones.
