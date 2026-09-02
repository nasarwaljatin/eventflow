# Phase 5 — Testing, Polish, Demo Data & Deployment

> **Goals Covered:** All 10 (verification & hardening), Documentation, Deployment
> **Estimated Time:** ~1.5 hours
> **Priority:** 🟢 Critical for submission — this phase makes or breaks the final impression
> **Depends On:** Phase 4 complete

---

## Objectives

1. Write comprehensive automated tests (unit, integration, E2E).
2. Polish the UI/UX for production quality.
3. Seed realistic demo data that showcases every feature.
4. Deploy to free-tier hosting.
5. Complete all documentation files.
6. Final verification walkthrough of all 10 goals.

---

## 5.1 — Automated Testing

### Testing Stack

| Layer          | Tool                                  | What It Tests                          |
| -------------- | ------------------------------------- | -------------------------------------- |
| Unit Tests     | Vitest (backend) + React Testing Library (frontend) | Pure functions, state machine, validation |
| Integration    | Vitest + Supertest                    | API endpoints end-to-end with real DB  |
| E2E (optional) | Playwright or Cypress                 | Full user flows through the browser    |

### Critical Test Cases

#### Unit Tests (Backend)

```typescript
// __tests__/unit/stateMachine.test.ts
describe('Registration State Machine', () => {
  it('allows reserved → confirmed', () => { ... });
  it('allows reserved → cancelled', () => { ... });
  it('allows confirmed → checked_in', () => { ... });
  it('allows confirmed → cancelled', () => { ... });
  it('rejects checked_in → cancelled', () => { ... });
  it('rejects expired → any transition', () => { ... });
  it('rejects cancelled → any transition', () => { ... });
  it('rejects reserved → checked_in (must confirm first)', () => { ... });
});

// __tests__/unit/csvParser.test.ts
describe('CSV Import Parser', () => {
  it('parses valid rows', () => { ... });
  it('rejects rows with invalid email', () => { ... });
  it('rejects rows with empty name', () => { ... });
  it('handles extra/missing columns gracefully', () => { ... });
  it('trims whitespace from fields', () => { ... });
});
```

#### Integration Tests (API)

```typescript
// __tests__/integration/registration.test.ts
describe('POST /api/sessions/:id/registrations', () => {
  it('creates a reservation when capacity is available', async () => { ... });
  it('returns 409 when session is at full capacity', async () => { ... });
  it('returns 409 for duplicate email in same session', async () => { ... });
  it('allows re-registration after cancellation', async () => { ... });
});

describe('Capacity Race Condition', () => {
  it('does not oversell when two requests arrive simultaneously', async () => {
    // Create session with capacity = 1
    // Fire two concurrent registration requests
    // Assert exactly one succeeds, one fails with 409
    const [result1, result2] = await Promise.all([
      request(app).post(`/api/sessions/${sessionId}/registrations`).send(attendee1),
      request(app).post(`/api/sessions/${sessionId}/registrations`).send(attendee2)
    ]);
    const successes = [result1, result2].filter(r => r.status === 201);
    const failures = [result1, result2].filter(r => r.status === 409);
    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(1);
  });
});

// __tests__/integration/auth.test.ts
describe('Role-Based Access Control', () => {
  it('allows organizer to create events', async () => { ... });
  it('rejects staff from creating events (403)', async () => { ... });
  it('allows assigned staff to check in registrations', async () => { ... });
  it('rejects unassigned staff from accessing session (403)', async () => { ... });
});

// __tests__/integration/auditLog.test.ts
describe('Audit Log Immutability', () => {
  it('creates an audit entry on every status change', async () => { ... });
  it('has no update endpoint', async () => {
    const res = await request(app).patch(`/api/audit/${auditId}`).send({ note: 'tampered' });
    expect(res.status).toBe(404);
  });
  it('has no delete endpoint', async () => {
    const res = await request(app).delete(`/api/audit/${auditId}`);
    expect(res.status).toBe(404);
  });
});
```

#### Frontend Tests

```typescript
// __tests__/components/CapacityBar.test.tsx
describe('CapacityBar', () => {
  it('renders green when < 70% full', () => { ... });
  it('renders yellow when 70-89% full', () => { ... });
  it('renders red when >= 90% full', () => { ... });
  it('shows "FULL" label when at 100%', () => { ... });
});

// __tests__/components/StatusBadge.test.tsx
describe('StatusBadge', () => {
  it('renders correct color and label for each status', () => { ... });
});
```

### Test Database Strategy

- Use a separate test database (e.g., `event_registration_test`).
- Before each test suite: run migrations, seed minimal data.
- After each test: truncate tables (not drop — faster).
- Environment: `NODE_ENV=test` loads `.env.test`.

---

## 5.2 — UI/UX Polish

### Global Design System

| Element               | Implementation                                                    |
| --------------------- | ----------------------------------------------------------------- |
| **Color Palette**     | Professional and accessible (WCAG AA contrast ratios)             |
| **Typography**        | Inter or system font stack, consistent heading hierarchy           |
| **Spacing**           | Tailwind's spacing scale, consistent padding/margin                |
| **Loading States**    | Skeleton loaders for data-heavy pages, spinners for actions        |
| **Empty States**      | Helpful illustrations + CTAs when no data exists                   |
| **Error States**      | Toast notifications for actions, inline errors for forms           |
| **Responsive Design** | Mobile-first, works on tablets (check-in staff use tablets at doors) |
| **Dark Mode**         | Optional but nice-to-have (Tailwind `dark:` classes)              |

### Navigation & Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  🎯 EventHub          🔔(3)  [Admin User ▾]  [Logout]          │
├──────────────┬───────────────────────────────────────────────────┤
│              │                                                   │
│  🏠 Dashboard│   [ Main Content Area ]                          │
│  📅 Events   │                                                   │
│  📋 All Regs │                                                   │
│  🔔 Alerts   │                                                   │
│  👤 My Sessions│                                                 │
│              │                                                   │
│  ──────────  │                                                   │
│  ⚙ Settings │                                                   │
│              │                                                   │
└──────────────┴───────────────────────────────────────────────────┘
```

### Key UX Details

- **Optimistic updates** for status transitions (show new state immediately, revert on error).
- **Confirmation dialogs** for destructive actions (cancel registration, delete session, archive event).
- **Breadcrumbs** on detail pages: `Events > Tech Summit 2026 > Keynote Address`
- **Keyboard shortcuts** (optional): `Ctrl+K` for search, `Enter` to confirm dialogs.
- **Toast notifications** for success/error on mutations (using `react-hot-toast` or `sonner`).
- **Form auto-save** (optional): Draft state preserved in localStorage for create forms.

---

## 5.3 — Demo Data Seeding

### Seed Script: `prisma/seed.ts`

Create a comprehensive seed that demonstrates every feature:

```typescript
// prisma/seed.ts
async function seed() {
  // 1. Users
  const organizer = await createUser({
    email: 'organizer@demo.com',
    password: 'Demo1234!',
    full_name: 'Sarah Chen',
    role: 'organizer'
  });

  const staff1 = await createUser({
    email: 'staff1@demo.com',
    password: 'Demo1234!',
    full_name: 'Mike Johnson',
    role: 'check_in_staff'
  });

  const staff2 = await createUser({
    email: 'staff2@demo.com',
    password: 'Demo1234!',
    full_name: 'Emily Davis',
    role: 'check_in_staff'
  });

  // 2. Events
  const event1 = await createEvent({
    name: 'Tech Summit 2026',
    description: 'Annual technology conference featuring industry leaders...',
    venue: 'Grand Convention Center',
    start_date: today,
    end_date: addDays(today, 2),
    created_by: organizer.id
  });

  const event2 = await createEvent({
    name: 'Design Workshop Week',
    description: 'A week of hands-on UX/UI workshops...',
    venue: 'Creative Hub Studio',
    start_date: addDays(today, 7),
    end_date: addDays(today, 11),
    created_by: organizer.id
  });

  const archivedEvent = await createEvent({
    name: 'Past Conference 2025',
    // ... archived event to show archive/restore
    is_archived: true
  });

  // 3. Sessions (varying capacities to show different states)
  const keynote = await createSession({
    event_id: event1.id, title: 'Opening Keynote',
    capacity: 50, // will be filled near/at capacity
    start_time: today_9am, duration_min: 90, location: 'Main Hall'
  });

  const workshop = await createSession({
    event_id: event1.id, title: 'Advanced React Patterns',
    capacity: 30, // will be AT capacity (triggers alert)
    start_time: today_11am, duration_min: 120, location: 'Room B'
  });

  const panel = await createSession({
    event_id: event1.id, title: 'Future of AI Panel',
    capacity: 40, // partially filled
    start_time: tomorrow_2pm, duration_min: 60, location: 'Room C'
  });

  // 4. Staff Assignments
  await assignStaff(keynote.id, staff1.id, organizer.id);
  await assignStaff(workshop.id, staff1.id, organizer.id);
  await assignStaff(workshop.id, staff2.id, organizer.id);
  await assignStaff(panel.id, staff2.id, organizer.id);

  // 5. Registrations (all statuses represented)
  // - 48/50 for keynote (near capacity, mix of confirmed + checked_in)
  // - 30/30 for workshop (AT capacity — will trigger alert)
  // - 15/40 for panel (partially filled)
  // - Include: reserved, confirmed, checked_in, cancelled, expired registrations
  // - Include registrations with notes and timeline entries

  // 6. Audit trail entries for registrations with rich history

  // 7. At-capacity alert for the workshop (triggered, not dismissed)

  // 8. Check-in data spread across the last 14 days (for the chart)
}
```

### Demo Data Summary

| Entity             | Count  | Purpose                                               |
| ------------------ | ------ | ----------------------------------------------------- |
| Users              | 3–5    | 1–2 organizers, 2–3 staff                             |
| Events             | 3      | 1 active today, 1 upcoming, 1 archived                |
| Sessions           | 8–10   | Varying capacities and fill levels                    |
| Registrations      | 100+   | All statuses represented, spread across sessions       |
| Audit log entries  | 200+   | Rich timelines with notes                             |
| Capacity alerts    | 1–2    | At least one active, one dismissed                    |
| Staff assignments  | 4–6    | Multiple staff per session, staff across events        |

### Demo Credentials (for `SUBMISSION.md`)

| Role             | Email                | Password     |
| ---------------- | -------------------- | ------------ |
| Organizer        | organizer@demo.com   | Demo1234!    |
| Check-in Staff 1 | staff1@demo.com      | Demo1234!    |
| Check-in Staff 2 | staff2@demo.com      | Demo1234!    |

---

## 5.4 — Deployment

### Architecture (Free Tier)

```
┌──────────────┐      HTTPS       ┌──────────────┐      TCP       ┌──────────────┐
│              │  ←─────────────→ │              │  ←───────────→ │              │
│   Vercel     │   API Proxy /    │   Render     │   Prisma ORM   │   Supabase   │
│  (Frontend)  │   REST calls     │  (Backend)   │                │  (Postgres)  │
│              │                  │              │                │              │
└──────────────┘                  └──────────────┘                └──────────────┘
```

### Step-by-Step Deployment

#### 1. Database — Supabase (Free Tier)

1. Create a Supabase project.
2. Copy the connection string: `postgresql://postgres:PASSWORD@db.xxx.supabase.co:5432/postgres`
3. Enable the `pg_trgm` extension via Supabase SQL editor:
   ```sql
   CREATE EXTENSION IF NOT EXISTS pg_trgm;
   ```
4. Run Prisma migrations against the production database:
   ```bash
   DATABASE_URL="postgresql://..." npx prisma migrate deploy
   ```
5. Seed production data:
   ```bash
   DATABASE_URL="postgresql://..." npx prisma db seed
   ```

#### 2. Backend — Render (Free Tier)

1. Create a new **Web Service** on Render, connected to your GitHub repo.
2. Set build command: `cd server && npm install && npx prisma generate`
3. Set start command: `cd server && npm start`
4. Set environment variables:
   ```
   DATABASE_URL=postgresql://...
   JWT_SECRET=<generate-a-strong-secret>
   JWT_EXPIRY=15m
   REFRESH_TOKEN_EXPIRY=7d
   RESERVATION_HOLD_MINUTES=30
   NODE_ENV=production
   CORS_ORIGIN=https://your-app.vercel.app
   ```
5. Health check path: `/api/health`

> [!WARNING]
> Render free tier sleeps after 15 minutes of inactivity. First request can take 30–60 seconds.
> Note this in `SUBMISSION.md`.

#### 3. Frontend — Vercel (Free Tier)

1. Import the frontend directory from your GitHub repo.
2. Set environment variables:
   ```
   VITE_API_URL=https://your-app.onrender.com/api
   ```
3. Build command: `npm run build`
4. Output directory: `dist`

#### 4. Post-Deployment Verification

- [ ] Visit the live URL — login page loads.
- [ ] Login with organizer credentials — dashboard shows seeded data.
- [ ] Login with staff credentials — see only assigned sessions.
- [ ] Create a new registration — verify capacity enforcement.
- [ ] Run through the full lifecycle: Reserve → Confirm → Check In.
- [ ] Try an invalid transition — verify error message.
- [ ] Import a CSV — verify per-row report.
- [ ] Export a check-in sheet — verify CSV download.
- [ ] Check the dashboard charts — verify data accuracy.
- [ ] View a registration timeline — verify audit entries.
- [ ] Check alerts — verify at-capacity alert appears.
- [ ] Dismiss alert — verify it disappears from the badge.

---

## 5.5 — Documentation Completion

### Files to Complete

#### `docs/architecture.md`

- Diagram of frontend ↔ backend ↔ database.
- Where each piece runs (Vercel, Render, Supabase).
- Request path walkthrough: "User checks in an attendee" end-to-end.
- What you decided not to build (e.g., WebSocket real-time, email notifications).

#### `docs/schema.md`

- Every table with columns, types, and constraints.
- Relationship diagram (ERD).
- Which constraints are in the DB vs. application code.
- What you denormalized (if anything).
- What breaks first at 100x data (e.g., dashboard aggregation queries, text search).

#### `docs/plan.md`

- The 5 phases and how you split them.
- Estimated vs. actual time per phase.
- What you cut or deferred and why.

#### `docs/decisions.md`

At least 5 decisions. Examples:

1. **Tech stack choice** (e.g., chose Prisma over raw SQL).
2. **Capacity enforcement strategy** (e.g., `SELECT FOR UPDATE` vs. atomic insert).
3. **Session deletion policy** (block vs. cascade cancel).
4. **Text search approach** (trigram vs. LIKE vs. full-text).
5. **JWT vs. session cookies** for auth.
6. **One reversed decision** (e.g., started with LIKE, switched to trigram when it was too slow).

#### `docs/ai-prompts.md`

- Group prompts by what you were trying to achieve.
- Include at least one that produced wrong output.
- Describe what you corrected.

#### `SUBMISSION.md`

- Fill in all sections: links, demo credentials, stack table, goal checklist, time spent, next steps, least happy with.

---

## 5.6 — Final Verification Matrix

Run through every goal methodically:

| # | Goal                       | Test                                                                                 | ✅ |
|---|----------------------------|--------------------------------------------------------------------------------------|----|
| 1 | Accounts & roles           | Organizer can create events; staff cannot (403). Server enforced.                    | [ ] |
| 2 | Events                     | Create, edit, archive, restore. Archived events hidden by default.                   | [ ] |
| 3 | Sessions                   | Create, edit, delete within events. Capacity set. Opening event shows sessions.      | [ ] |
| 4 | Registration lifecycle     | Reserved→Confirmed→CheckedIn works. Illegal transitions rejected with message. Auto-expiry works. Cancellation frees seat. | [ ] |
| 5 | Assignment                 | Staff assigned to sessions by organizer. Staff sees "My Sessions" list.              | [ ] |
| 6 | Finding registrations      | Server-side search, filters (event/session/status), sort, pagination with total.     | [ ] |
| 7 | Bulk import/export         | CSV import with per-row report (created/duplicate/rejected). CSV export downloads.   | [ ] |
| 8 | Dashboard                  | Headline numbers correct. Status breakdown chart. By-session chart. 14-day check-in chart. | [ ] |
| 9 | Immutable history          | Timeline shows all changes + notes. No edit/delete possible. Organizers included.    | [ ] |
| 10| At-capacity alerts         | Alert triggered when full. Badge shows count. Dismiss works. Re-triggers on re-fill. | [ ] |

---

## 5.7 — Phase 5 Deliverables Checklist

- [ ] Unit tests for state machine, CSV parser, validation logic
- [ ] Integration tests for all critical API endpoints
- [ ] Race condition test for capacity enforcement
- [ ] RBAC integration tests (organizer vs. staff permissions)
- [ ] Audit log immutability test
- [ ] UI polished: loading states, empty states, error handling, responsive
- [ ] Toast notifications for all user actions
- [ ] Confirmation dialogs for destructive actions
- [ ] Breadcrumb navigation on detail pages
- [ ] Demo seed script with 100+ registrations and rich data
- [ ] Database deployed to Supabase with migrations and seed
- [ ] Backend deployed to Render with all env vars
- [ ] Frontend deployed to Vercel pointing to backend
- [ ] Live URL verified working end-to-end
- [ ] `docs/architecture.md` completed
- [ ] `docs/schema.md` completed with ERD
- [ ] `docs/plan.md` completed with time estimates
- [ ] `docs/decisions.md` completed with 5+ decisions
- [ ] `docs/ai-prompts.md` completed with prompt log
- [ ] `SUBMISSION.md` filled with all credentials and checklist
- [ ] Git history has incremental, meaningful commits across all phases
- [ ] Final review of all 10 goals against verification matrix

---

> [!TIP]
> **Commit strategy for Phase 5:**
> 1. `test: add unit tests for state machine and CSV parser`
> 2. `test: add integration tests for registration and auth APIs`
> 3. `test: add race condition test for capacity enforcement`
> 4. `feat: add loading states, empty states, and toast notifications`
> 5. `feat: add responsive layout and breadcrumb navigation`
> 6. `feat: add comprehensive demo seed data`
> 7. `docs: complete architecture.md`
> 8. `docs: complete schema.md with ERD`
> 9. `docs: complete plan.md with time breakdown`
> 10. `docs: complete decisions.md with 5+ entries`
> 11. `docs: complete ai-prompts.md`
> 12. `docs: fill in SUBMISSION.md`
> 13. `chore: configure deployment for Supabase + Render + Vercel`
> 14. `chore: final polish and README update`
