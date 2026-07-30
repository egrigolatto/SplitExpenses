# Coding Standards

## Objetivo

Este documento define las convenciones y estándares de desarrollo utilizados en Split Expenses.

Su propósito es mantener un código consistente, legible y fácil de mantener, independientemente del tamaño del proyecto o del número de colaboradores.

---

# Principios

Todas las decisiones de desarrollo seguirán estos principios:

- Simplicidad antes que complejidad.
- Una responsabilidad por módulo.
- Código explícito antes que implícito.
- Evitar duplicación de código (DRY).
- Favorecer la composición sobre la herencia.
- Mantener funciones pequeñas y enfocadas.
- Priorizar la legibilidad sobre la cantidad de líneas.

---

# Convenciones de nombres

## Archivos

Utilizar `kebab-case`.

```
meeting-service.ts
meeting-controller.ts
auth-routes.ts
```

---

## Variables

Utilizar `camelCase`.

```ts
const totalAmount = 100;
const currentUser = {};
```

---

## Funciones

Utilizar `camelCase`.

```ts
calculateBalance();
createMeeting();
findUserByEmail();
```

Las funciones deberán describir claramente la acción que realizan.

---

## Clases

Utilizar `PascalCase`.

```ts
MeetingService
AuthController
```

---

## Interfaces

Utilizar `PascalCase`.

```ts
interface User
interface Meeting
```

---

## Tipos

Utilizar `PascalCase`.

```ts
type JwtPayload
type MeetingSummary
```

---

## Constantes

Utilizar `UPPER_SNAKE_CASE`.

```ts
MAX_PARTICIPANTS

COOKIE_NAME

JWT_EXPIRES_IN
```

---

## Variables de entorno

Utilizar `UPPER_SNAKE_CASE`.

```
DATABASE_URL

JWT_SECRET

GOOGLE_CLIENT_ID
```

---

# Organización del backend

```text
src/

routes/
controllers/
services/
repositories/
middlewares/
schemas/
db/
config/
types/
utils/
lib/
```

## Responsabilidades

### routes

Definen las rutas de la API.

No contienen lógica de negocio.

---

### controllers

Reciben la petición HTTP.

- validan la entrada (mediante Zod)
- llaman al servicio correspondiente
- construyen la respuesta HTTP

No deben acceder directamente a la base de datos.

---

### services

Contienen la lógica de negocio.

Un servicio debe ser independiente de Express.

---

### repositories

Acceden a PostgreSQL mediante Drizzle.

No contienen reglas de negocio.

---

### middlewares

Autenticación.

Autorización.

Manejo de errores.

Rate limiting.

---

### schemas

Esquemas Zod.

Validaciones compartidas.

---

### utils

Funciones reutilizables.

No deben depender del dominio.

---

### lib

Configuraciones compartidas.

Clientes externos.

Logger.

---

# Organización del frontend

```text
src/

components/
pages/
layouts/
hooks/
services/
store/
schemas/
types/
routes/
utils/
```

## Responsabilidades

### pages

Representan una pantalla completa.

---

### components

Componentes reutilizables.

---

### hooks

Custom Hooks.

---

### services

Comunicación con la API.

---

### store

Estado global mediante Zustand.

---

### schemas

Validaciones con Zod.

---

### utils

Funciones auxiliares.

---

# Estado

## TanStack Query

Se utilizará únicamente para estado proveniente del servidor.

Ejemplos

- reuniones
- usuario autenticado

---

## Zustand

Se utilizará únicamente para estado global de la interfaz.

Ejemplos

- tema
- sidebar
- preferencias

No almacenar datos provenientes de la API.

---

# Validaciones

Toda la información recibida deberá validarse mediante Zod.

Nunca confiar en datos provenientes del cliente.

Las validaciones deberán reutilizarse cuando sea posible.

---

# Manejo de errores

Los errores deberán manejarse de forma centralizada.

No utilizar múltiples formatos de respuesta.

Formato estándar:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": []
}
```

---

# Logging

Se utilizará Pino.

Registrar:

- inicio del servidor
- errores
- peticiones importantes

No registrar:

- contraseñas
- tokens
- cookies
- información sensible

---

# Testing

Cada nueva funcionalidad deberá incluir pruebas cuando sea razonable.

Backend

- Unit Testing
- Integration Testing

Frontend

- Component Testing

---

# Git

## Ramas

```
main
develop
feature/*
fix/*
docs/*
refactor/*
```

---

## Commits

Se utilizará Conventional Commits.

Ejemplos

```
feat(auth): add Google OAuth

fix(meetings): validate total amount

docs(api): update endpoints

refactor(users): simplify repository

test(auth): add login tests

chore: update dependencies
```

---

# Formato del código

Se utilizarán:

- ESLint
- Prettier

No deberán deshabilitarse reglas sin una justificación clara.

---

# TypeScript

El proyecto utilizará modo `strict`.

Evitar el uso de:

```ts
any
```

Preferir:

- unknown
- tipos específicos
- interfaces
- type aliases

---

# Seguridad

- Nunca almacenar contraseñas en texto plano.
- Utilizar Argon2 para el hash de contraseñas.
- Utilizar Cookies HttpOnly para la autenticación.
- Validar toda la información recibida.
- Utilizar consultas parametrizadas mediante Drizzle.
- No exponer información sensible en los errores.

---

# Documentación

Toda decisión importante de arquitectura deberá quedar documentada.

Cada documento deberá responder una única pregunta.

Ejemplos:

- README → ¿Qué es el proyecto?
- api-design → ¿Cómo se comunica el sistema?
- database-design → ¿Cómo se almacenan los datos?
- coding-standards → ¿Cómo escribimos el código?

---

# Filosofía

Este proyecto tiene como objetivo servir como base para futuros desarrollos.

Las herramientas se seleccionarán por su estabilidad, documentación y adopción en la industria, priorizando comprender el motivo de cada decisión antes de incorporarlas al proyecto.