# AGENTS.md — Client

## Objetivo

Este documento guía a agentes de IA y desarrolladores que trabajen en `client/`.

Define comandos, estructura, convenciones y reglas específicas del frontend de Split Expenses.

Las reglas generales del proyecto viven en:

- `README.md` → ¿Qué es el proyecto?
- `docs/api-design.md` → ¿Cómo se comunica el sistema?
- `docs/coding-standards.md` → ¿Cómo escribimos el código?

En caso de conflicto, este documento precisa esas reglas para el frontend, no las reemplaza.

---

# Contexto

- `client/` es una SPA React que consume la REST API de `server/` (`/api/v1`).
- La lógica de cálculo del reparto de gastos vive **exclusivamente** en el frontend.
- El backend solo autentica y persiste. Nunca delegar cálculo al servidor ni duplicar persistencia en el cliente.
- La aplicación debe funcionar completa sin autenticación (MVP anónimo).

---

# Stack

| Herramienta          | Propósito                        |
| -------------------- | -------------------------------- |
| React 19             | Biblioteca principal             |
| TypeScript (strict)  | Tipado estático                  |
| Vite                 | Build tool y dev server          |
| React Router         | Enrutamiento                     |
| TanStack Query       | Estado del servidor              |
| Zustand              | Estado global de la interfaz     |
| React Hook Form      | Manejo de formularios            |
| Zod                  | Validación                       |
| Axios                | Cliente HTTP                     |
| Tailwind CSS         | Estilos                          |
| Vitest + RTL         | Tests unitarios y de componentes |

No agregar dependencias nuevas sin justificarlas en el PR.

---

# Comandos

Ejecutar desde `client/`:

```bash
pnpm install          # instalar dependencias
pnpm dev              # dev server (http://localhost:5173)
pnpm build            # typecheck + build de producción
pnpm lint             # ESLint
pnpm format           # Prettier write
pnpm format:check     # Prettier check (CI)
pnpm test             # Vitest run
pnpm test:watch       # Vitest watch
```

Con Docker (desde la raíz del repo):

```bash
docker compose --profile dev up     # postgres + server-dev + client-dev
```

---

# Variables de entorno

- Solo variables con prefijo `VITE_` (son públicas, se embeben en el bundle).
- `VITE_API_URL` → URL base de la API (ej. `http://localhost:3000`).
- Nunca guardar secretos, tokens ni cookies en variables de entorno ni en el bundle.
- Validar `import.meta.env` con Zod al arrancar (fallar rápido si falta configuración).

---

# Estructura

```text
src/
├── components/   # componentes reutilizables
├── pages/        # una pantalla completa por archivo
├── layouts/      # envolventes de pantalla (header, shell)
├── hooks/        # custom hooks
├── services/     # comunicación con la API (axios)
├── store/        # estado global UI (Zustand)
├── schemas/      # esquemas Zod (formularios y respuestas API)
├── types/        # tipos e interfaces de dominio
├── routes/       # definición de rutas (React Router)
└── utils/        # funciones puras reutilizables (incluye el cálculo)
```

Reglas:

- `pages/` compone componentes y hooks; no contiene lógica de cálculo ni llamadas HTTP directas.
- `services/` es el único lugar que toca axios.
- `utils/` contiene funciones puras, sin dependencias de React ni de la red. Testeables en aislamiento.
- Un componente por archivo. Responsabilidad única.

---

# Convenciones de código

- Archivos y carpetas: `kebab-case` (`meeting-form.tsx`, `use-session.ts`).
- Componentes, interfaces y tipos: `PascalCase` (`MeetingForm`, `interface Meeting`).
- Variables y funciones: `camelCase` (`calculateBalance`).
- Constantes: `UPPER_SNAKE_CASE` (`MAX_PARTICIPANTS`).
- TypeScript en modo `strict`. Prohibido `any`; preferir `unknown` y narrowing.
- Validar con Zod todo dato que cruce una frontera: inputs de formularios y respuestas de la API.
- Sin comentarios explicativos por defecto; el código y los nombres deben bastar.

---

# Estado

## TanStack Query

Único dueño del estado proveniente del servidor:

- usuario autenticado (`GET /auth/me`)
- reuniones guardadas (`GET /meetings`)

Reglas:

- Una query key por recurso, jerárquica: `["meetings"]`, `["meetings", id]`.
- Mutaciones invalidan las keys afectadas; no actualizar caché a mano salvo optimistic updates justificados.
- No copiar datos de queries a Zustand ni a estado local duplicado.

## Zustand

Solo estado global de interfaz: tema, sidebar, preferencias.

Nunca almacenar datos de la API.

## Formularios

React Hook Form + resolver de Zod (`@hookform/resolvers`).

Los esquemas viven en `schemas/` y se reutilizan entre formulario y tipos (`z.infer`).

---

# Contrato con la API

Base: `${VITE_API_URL}/api/v1`.

## Envelope

Éxito:

```json
{ "success": true, "data": {} }
```

Error:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [{ "field": "name", "message": "..." }]
}
```

Toda respuesta se valida con un esquema Zod del envelope antes de usarse.

## Autenticación

- La sesión vive en cookies HttpOnly (`access_token`, `access_token_refresh`). El cliente **nunca** lee, escribe ni persiste tokens (nada de localStorage).
- Axios configurado con `withCredentials: true`.
- Interceptor centralizado: ante un `401`, intentar **una sola vez** `POST /auth/refresh` y reintentar la petición original; si el refresh falla, cerrar sesión limpiamente.
- Requests paralelos que reciban 401 deben compartir un único refresh en vuelo (no disparar N refreshes).
- Bootstrap: al montar la app, consultar `GET /auth/me`; mientras responde, mostrar estado de carga, no "no autenticado".

## Rutas privadas

`GET/POST/PATCH/DELETE /meetings` requieren sesión. Sin sesión, la UI ofrece guardar → login, nunca bloquear el flujo anónimo de cálculo.

---

# Cálculo del reparto

- Implementado en `utils/` como funciones puras: entradas (participantes y montos) → salidas (balances y transferencias mínimas).
- Sin efectos, sin React, sin red.
- Cubierto por tests unitarios exhaustivos (casos borde: montos cero, divisiones no exactas, un solo participante, empates).
- Manejo de redondeo explícito y documentado en el código (centavos).

---

# Testing

- Vitest + React Testing Library.
- Testear comportamiento, no implementación: consultar por rol, label o texto visible.
- Toda utilidad de `utils/` con lógica de cálculo tiene tests unitarios.
- Flujos críticos con test de componente: formulario de reunión, resumen, login.
- Mockear `services/` (no axios interno) en tests de componentes.
- No dejar tests para el final: cada feature mergea con sus tests.

---

# Seguridad

- Nunca loguear tokens, cookies ni contraseñas.
- No exponer mensajes crudos del servidor como único feedback: traducir a mensajes de UI amigables.
- Escapado y render seguro: no usar `dangerouslySetInnerHTML`.
- Las variables `VITE_*` son públicas: nada sensible ahí.

---

# Accesibilidad y UI

- HTML semántico: `label` asociado a cada input, botones reales para acciones.
- Navegable por teclado: foco visible, orden lógico, traps de foco en modales.
- Mensajes de error de formulario asociados al campo (`aria-describedby`).
- Responsive desde el inicio (mobile first), según wireframes en `docs/`.
- Textos de interfaz en español.

---

# Git

- Ramas `feature/*`, `fix/*`, `docs/*`, `refactor/*` desde `develop`. Nunca commitear directo a `develop` ni `main`.
- Conventional Commits: `feat(client): ...`, `fix(meetings): ...`, `chore(client): ...`, `test(split): ...`.
- Un commit = una unidad de trabajo. Commits pequeños y legibles.
- Antes de commitear: `pnpm build`, `pnpm lint`, `pnpm format:check`, `pnpm test` en verde.
- El pre-commit (husky en la raíz del repo) corre lint-staged sobre los archivos staged de `client/`.

---

# Skills disponibles

Skills instaladas localmente en el repo (raíz), aplicables al trabajar en este directorio:

- `vercel-react-best-practices` → patrones y rendimiento de React.
- `web-design-guidelines` → accesibilidad y reglas de UI web.
- `frontend-design` → acabado visual y diseño de interfaces.

Consultarlas antes de crear componentes nuevos o rediseñar pantallas.

---

# Checklist antes de un PR

- El build y los tests pasan.
- Sin `any`, sin secretos, sin `console.log` de depuración.
- Datos de API y formularios validados con Zod.
- Estado en el dueño correcto (TanStack Query / Zustand / RHF).
- UI responsive y accesible.
- Documentación actualizada si cambió un contrato o convención.
