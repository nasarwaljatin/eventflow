# Phase 1 — Foundation & Authentication

> **Goals Covered:** #1 (Accounts & Roles), #2 (Events — partial)
> **Estimated Time:** ~2.5 hours
> **Priority:** 🔴 Critical — everything else depends on this

---

## Objectives

1. Set up the full project scaffold (frontend + backend + database).
2. Design and migrate the core database schema.
3. Implement secure authentication (signup, login, logout, session management).
4. Implement the role-based access control system (Organizer vs. Check-in Staff).
5. Build basic Event CRUD (create, read, update, archive/restore).

---

## 1.1 — Project Scaffold & Tooling

### Backend

| Decision       | Choice                                                                 |
| -------------- | ---------------------------------------------------------------------- |
| Runtime        | Node.js (LTS) with TypeScript                                         |
| Framework      | Express.js or Fastify (pick one — Fastify preferred for performance)  |
| ORM            | Prisma (type-safe, auto-migrations, great DX)                         |
| Database       | PostgreSQL (Supabase free tier for hosted, or local Docker for dev)    |
| Validation     | Zod — runtime schema validation on every API boundary                 |
| Auth           | bcrypt for password hashing, JWT (access + refresh tokens) or session cookies |

### Frontend

| Decision       | Choice                                                                |
| -------------- | --------------------------------------------------------------------- |
| Framework      | React 18+ with TypeScript                                            |
| Build Tool     | Vite                                                                  |
| Routing        | React Router v6+                                                     |
| State Mgmt     | TanStack Query (server state) + Zustand (client state)               |
| UI Library     | Tailwind CSS + shadcn/ui (accessible, composable components)         |
| HTTP Client    | Axios with interceptors for auth token refresh                       |
| Forms          | React Hook Form + Zod resolver                                      |

### DevOps & Quality

```
├── .env.example          # Template — never commit real secrets
├── .gitignore
├── docker-compose.yml    # Local Postgres + optional pgAdmin
├── eslint.config.js
├── prettier.config.js
├── tsconfig.json
└── README.md
```

- **Linting:** ESLint + Prettier enforced via pre-commit hooks (husky + lint-staged).
- **Git:** Conventional commits (`feat:`, `fix:`, `docs:`, `refactor:`).
- **Environment:** `.env` files for `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRY`, `RESERVATION_HOLD_MINUTES`.

---

## 1.2 — Database Schema (Core Tables)

Design the full schema upfront even though later phases build on it. Migrate only the tables needed now; the rest are scaffolded as empty migrations for Phase 2+.

### Tables for Phase 1

```sql
-- Users & Auth
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(255) NOT NULL,
  role          VARCHAR(20) NOT NULL CHECK (role IN ('organizer', 'check_in_staff')),
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Events
CREATE TABLE events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(255) NOT NULL,
  description   TEXT,
  venue         VARCHAR(255) NOT NULL,
  start_date    DATE NOT NULL,
  end_date      DATE NOT NULL,
  is_archived   BOOLEAN DEFAULT FALSE,
  created_by    UUID NOT NULL REFERENCES users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_event_dates CHECK (end_date >= start_date)
);

CREATE INDEX idx_events_archived ON events(is_archived);
CREATE INDEX idx_events_dates ON events(start_date, end_date);
```

### Schema Design Principles

- **UUIDs** as primary keys (no sequential ID leaking).
- **`CHECK` constraints** in the database for data integrity (dates, roles, statuses).
- **`created_at` / `updated_at`** on every table — use a Prisma middleware or DB trigger for auto-update.
- **Soft-delete pattern** for events via `is_archived` (never hard-delete).

---

## 1.3 — Authentication System

### API Endpoints

| Method | Endpoint              | Description                    | Auth  |
| ------ | --------------------- | ------------------------------ | ----- |
| POST   | `/api/auth/register`  | Create a new account           | None  |
| POST   | `/api/auth/login`     | Login, receive tokens          | None  |
| POST   | `/api/auth/logout`    | Invalidate refresh token       | Yes   |
| POST   | `/api/auth/refresh`   | Rotate access token            | Refresh Token |
| GET    | `/api/auth/me`        | Get current user profile       | Yes   |

### Implementation Details

1. **Password Hashing:** `bcrypt` with cost factor 12.
2. **JWT Strategy:**
   - Access token: 15-minute expiry, stored in memory (never localStorage).
   - Refresh token: 7-day expiry, stored in httpOnly secure cookie.
   - On every access token expiry, silently rotate via `/auth/refresh`.
3. **Auth Middleware:**
   ```typescript
   // middleware/auth.ts
   export const authenticate = async (req, res, next) => {
     // 1. Extract token from Authorization header
     // 2. Verify JWT signature and expiry
     // 3. Attach user to req.user
     // 4. Call next() or return 401
   };

   export const authorize = (...roles: string[]) => (req, res, next) => {
     // 1. Check req.user.role is in allowed roles
     // 2. Return 403 if not
   };
   ```
4. **Input Validation:** Every auth endpoint validates with Zod before touching the DB.
5. **Rate Limiting:** Apply rate limiter to `/auth/login` (5 attempts per minute per IP).

### Frontend Auth Flow

- `AuthContext` provider wrapping the app.
- `useAuth()` hook exposing `user`, `login()`, `logout()`, `isAuthenticated`.
- `ProtectedRoute` component that redirects unauthenticated users to `/login`.
- `RoleGuard` component that checks role and shows 403 or redirects.
- Axios interceptor that auto-attaches access token and handles 401 refresh silently.

---

## 1.4 — Role-Based Access Control (RBAC)

### Roles

| Role             | Can Create Events | Can Create Sessions | Can Manage All Sessions | Can Manage Assigned Sessions |
| ---------------- | :---------------: | :-----------------: | :---------------------: | :--------------------------: |
| **Organizer**    | ✅                | ✅                  | ✅                      | ✅                           |
| **Check-in Staff** | ❌              | ❌                  | ❌                      | ✅                           |

### Enforcement Rules

> [!IMPORTANT]
> Role enforcement MUST happen on the server. The frontend hides UI elements for convenience, but
> every API endpoint independently verifies permissions. A staff member hitting an organizer-only
> endpoint directly must receive a `403 Forbidden` response.

- **Middleware chain pattern:**
  ```
  router.post('/events', authenticate, authorize('organizer'), createEvent);
  router.patch('/events/:id', authenticate, authorize('organizer'), updateEvent);
  ```

- **Session-scoped access for staff:** For endpoints involving a session (registrations, check-in),
  the middleware checks the `session_staff` join table to confirm assignment before allowing the action.

---

## 1.5 — Event CRUD

### API Endpoints

| Method | Endpoint                    | Description                          | Roles     |
| ------ | --------------------------- | ------------------------------------ | --------- |
| POST   | `/api/events`               | Create a new event                   | Organizer |
| GET    | `/api/events`               | List events (excludes archived by default) | All Auth  |
| GET    | `/api/events/:id`           | Get event details                    | All Auth  |
| PATCH  | `/api/events/:id`           | Update event fields                  | Organizer |
| PATCH  | `/api/events/:id/archive`   | Toggle archive status                | Organizer |

### Business Rules

- `start_date` must be today or in the future on creation (editable later).
- `end_date >= start_date` — enforced both in Zod and the DB constraint.
- Archiving sets `is_archived = true`; restoring sets it to `false`.
- Archived events are excluded from default `GET /events` unless `?include_archived=true` is passed.
- Archiving does **not** cascade-delete sessions or registrations.

### Frontend Pages

| Page               | Route              | Description                                      |
| ------------------ | ------------------ | ------------------------------------------------ |
| **Login**          | `/login`           | Email + password form                            |
| **Register**       | `/register`        | Signup form (role selection: organizer / staff)   |
| **Events List**    | `/events`          | Card/table view with archive toggle filter       |
| **Create Event**   | `/events/new`      | Form: name, description, venue, dates            |
| **Event Detail**   | `/events/:id`      | Event info + sessions list (built in Phase 2)    |
| **Edit Event**     | `/events/:id/edit` | Pre-filled form for editing                      |

---

## 1.6 — Phase 1 Deliverables Checklist

- [ ] Git repo initialized with `.gitignore`, `README.md`, and initial commit
- [ ] Backend scaffold: Express/Fastify + TypeScript + Prisma + Zod
- [ ] Frontend scaffold: Vite + React + TypeScript + Tailwind + shadcn/ui
- [ ] Docker Compose for local Postgres
- [ ] Database migrated with `users` and `events` tables
- [ ] Auth endpoints: register, login, logout, refresh, me
- [ ] Auth middleware: `authenticate` + `authorize(role)`
- [ ] Protected routes in frontend with role-based guards
- [ ] Event CRUD API with full validation
- [ ] Events list page with archive/restore toggle
- [ ] Create/Edit event forms
- [ ] Responsive layout shell (sidebar nav, header with user info)
- [ ] Error handling middleware (centralized, consistent JSON error format)
- [ ] API response format standardized: `{ success, data, error, meta }`

---

## Architecture After Phase 1

```
┌──────────────┐       HTTPS        ┌──────────────────┐       TCP        ┌─────────────┐
│              │  ←───────────────→  │                  │  ←────────────→  │             │
│   React SPA  │   REST JSON API    │  Node.js Server  │    Prisma ORM    │  PostgreSQL │
│   (Vite)     │                    │  (Express/Fastify)│                  │  (Supabase) │
│              │                    │                  │                  │             │
└──────────────┘                    └──────────────────┘                  └─────────────┘
```

---

> [!TIP]
> **Commit strategy for Phase 1:**
> 1. `feat: scaffold backend with Express + Prisma + TypeScript`
> 2. `feat: scaffold frontend with Vite + React + Tailwind`
> 3. `feat: add users table migration and seed`
> 4. `feat: implement auth endpoints (register, login, logout, refresh)`
> 5. `feat: add auth middleware and role-based authorization`
> 6. `feat: add events table and CRUD API`
> 7. `feat: build login/register pages with auth context`
> 8. `feat: build events list and create/edit pages`
> 9. `refactor: standardize error handling and API response format`
