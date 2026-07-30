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

### Health Check

```
GET /health
```

Descripción

Verifica que el servidor esté funcionando correctamente.

Respuesta

```json
{
  "success": true,
  "data": {
    "status": "ok"
  }
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
    "id": "...",
    "name": "Juan Pérez"
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

## Logout

```
POST /auth/logout
```

Elimina la cookie de autenticación.

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
GET /meetings
```

Devuelve todas las reuniones pertenecientes al usuario.

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
      "message": "Name is required"
    }
  ]
}
```

---

# Códigos HTTP

| Código | Significado |
|---------|-------------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 500 | Internal Server Error |

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