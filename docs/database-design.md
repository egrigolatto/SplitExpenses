# Database Design

## Objetivo

Este documento describe el diseño de la base de datos de **Split Expenses**.

Su propósito es definir la estructura relacional que permitirá almacenar la información de forma consistente, segura y escalable.

La implementación utilizará **PostgreSQL** como motor de base de datos y **Drizzle ORM** como herramienta de acceso a datos.

---

# Principios

La base de datos seguirá los siguientes principios:

- Normalización de datos.
- Integridad referencial mediante claves foráneas.
- Uso de UUID como claves primarias.
- Restricciones para garantizar la consistencia de los datos.
- Eliminación en cascada cuando corresponda.
- Auditoría mediante timestamps.
- Diseño preparado para futuras ampliaciones.

---

# Modelo relacional

El sistema estará compuesto inicialmente por tres tablas principales.

```text
users
   │
   │ 1
   ▼
meetings
   │
   │ 1
   ▼
participants
```

---

# Tabla `users`

Representa los usuarios registrados en la aplicación.

| Campo | Tipo | Restricciones |
|--------|------|---------------|
| id | UUID | PK |
| name | VARCHAR(100) | NOT NULL |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| password_hash | TEXT | NULL |
| google_id | TEXT | NULL |
| created_at | TIMESTAMP | NOT NULL |
| updated_at | TIMESTAMP | NOT NULL |

## Observaciones

- Un usuario puede autenticarse mediante credenciales o Google OAuth.
- Cuando utilice Google OAuth, `password_hash` podrá ser `NULL`.
- El correo electrónico deberá ser único.

---

# Tabla `meetings`

Representa una reunión creada por un usuario.

| Campo | Tipo | Restricciones |
|--------|------|---------------|
| id | UUID | PK |
| owner_id | UUID | FK → users.id |
| name | VARCHAR(100) | NOT NULL |
| meeting_date | DATE | NOT NULL |
| total_amount | DECIMAL(10,2) | NOT NULL |
| created_at | TIMESTAMP | NOT NULL |
| updated_at | TIMESTAMP | NOT NULL |

## Relaciones

- Una reunión pertenece a un único usuario.
- Un usuario puede crear múltiples reuniones.

---

# Tabla `participants`

Representa un participante dentro de una reunión.

| Campo | Tipo | Restricciones |
|--------|------|---------------|
| id | UUID | PK |
| meeting_id | UUID | FK → meetings.id |
| user_id | UUID | FK → users.id, NULL |
| name | VARCHAR(100) | NOT NULL |
| paid_amount | DECIMAL(10,2) | NOT NULL |

## Relaciones

- Un participante pertenece a una única reunión.
- Una reunión puede contener múltiples participantes.
- Un participante puede estar asociado a un usuario registrado (`user_id`) o ser simplemente un participante sin cuenta (`NULL`).

## Observaciones

El campo `user_id` permite identificar al participante que representa al usuario autenticado. Esto posibilita generar estadísticas personales sin necesidad de duplicar información en la tabla `users`.

---

# Relaciones

```text
users
   │
   │ 1
   │
   │ N
   ▼
meetings
   │
   │ 1
   │
   │ N
   ▼
participants

participants.user_id
        │
        │ 0..1
        ▼
users
```

---

# Integridad referencial

## users → meetings

Al eliminar un usuario se eliminarán automáticamente todas las reuniones creadas por él.

```sql
ON DELETE CASCADE
```

---

## meetings → participants

Al eliminar una reunión se eliminarán automáticamente todos sus participantes.

```sql
ON DELETE CASCADE
```

---

## participants → users

Si un usuario es eliminado, el participante conservará su nombre, pero dejará de estar asociado a una cuenta.

```sql
ON DELETE SET NULL
```

Esto evita perder el historial de reuniones.

---

# Índices

## users

- `email` (UNIQUE)

---

## meetings

- `owner_id`

---

## participants

- `meeting_id`
- `user_id`

---

# Restricciones

## users

- Email obligatorio.
- Email único.

---

## meetings

- El nombre es obligatorio.
- `total_amount >= 0`.

---

## participants

- El nombre es obligatorio.
- `paid_amount >= 0`.

---

# Decisiones de diseño

## UUID

Todas las tablas utilizarán UUID como clave primaria.

### Motivos

- Evitar identificadores secuenciales.
- Mejor compatibilidad con sistemas distribuidos.
- Mayor dificultad para enumerar registros desde el exterior.

---

## Soft Delete

No se implementará **Soft Delete** en la primera versión.

Las eliminaciones serán permanentes.

---

## Auditoría

Las tablas principales incluirán:

- `created_at`
- `updated_at`

para registrar la fecha de creación y última modificación de cada registro.

---

## Participantes vinculados a usuarios

Solo el participante que represente al usuario autenticado tendrá un `user_id`.

Los demás participantes podrán existir únicamente con su nombre.

Esto permite:

- Mantener el funcionamiento sin necesidad de que todos tengan una cuenta.
- Obtener estadísticas del usuario autenticado.
- Mantener un modelo de datos simple.

---

# Implementación

La base de datos será implementada utilizando:

- PostgreSQL
- Drizzle ORM
- drizzle-kit para la generación y ejecución de migraciones

Este documento servirá como referencia para la implementación del esquema de base de datos y futuras migraciones.