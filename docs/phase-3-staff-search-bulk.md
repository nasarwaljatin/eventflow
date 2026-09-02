# Phase 3 — Staff Assignment, Search & Filtering, Bulk Operations

> **Goals Covered:** #5 (Assignment), #6 (Finding Registrations), #7 (Bulk Import/Export)
> **Estimated Time:** ~3 hours
> **Priority:** 🟠 High — operational features staff need on event day
> **Depends On:** Phase 2 complete

---

## Objectives

1. Implement staff-to-session assignment (many-to-many).
2. Build the "My Sessions" view for check-in staff.
3. Build the advanced, server-side registration search/filter/sort/paginate system.
4. Implement CSV bulk import with per-row validation and reporting.
5. Implement CSV export of session check-in sheets.

---

## 3.1 — Staff Assignment System

### Database Table

```sql
CREATE TABLE session_staff (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT uq_session_staff UNIQUE (session_id, user_id)
);

CREATE INDEX idx_ss_session ON session_staff(session_id);
CREATE INDEX idx_ss_user ON session_staff(user_id);
```

### API Endpoints

| Method | Endpoint                                      | Description                             | Roles     |
| ------ | --------------------------------------------- | --------------------------------------- | --------- |
| POST   | `/api/sessions/:id/staff`                     | Assign a staff member to a session      | Organizer |
| DELETE | `/api/sessions/:id/staff/:userId`             | Remove a staff assignment               | Organizer |
| GET    | `/api/sessions/:id/staff`                     | List staff assigned to a session        | Organizer |
| GET    | `/api/me/sessions`                            | Get all sessions assigned to current user | Staff   |

### Business Rules

- Only organizers can add or remove staff assignments.
- A staff member can be assigned to any number of sessions across any number of events.
- Multiple staff can be assigned to the same session.
- Assigning the same staff to the same session twice returns a `409 Conflict`.
- Removing a non-existent assignment returns `404`.

### Access Control Integration

Extend the session-level authorization middleware from Phase 2:

```typescript
// middleware/sessionAccess.ts
export const canAccessSession = async (req, res, next) => {
  const { user } = req;
  const sessionId = req.params.sessionId || req.params.id;

  if (user.role === 'organizer') {
    return next(); // Organizers can access all sessions
  }

  // Check-in staff: verify assignment
  const assignment = await prisma.sessionStaff.findUnique({
    where: {
      session_id_user_id: { session_id: sessionId, user_id: user.id }
    }
  });

  if (!assignment) {
    return res.status(403).json({
      success: false,
      error: 'You are not assigned to this session'
    });
  }

  next();
};
```

### Frontend: Staff Assignment UI

- **Session Detail Page (Organizer view):** Add a "Staff" tab showing assigned staff with an "Assign Staff" button that opens a searchable user picker (filtered to `check_in_staff` role).
- **Remove Assignment:** Inline "Remove" button next to each assigned staff member.

### Frontend: "My Sessions" Page (Staff View)

| Page             | Route           | Description                                      |
| ---------------- | --------------- | ------------------------------------------------ |
| **My Sessions**  | `/my-sessions`  | All sessions the logged-in staff is assigned to   |

- Grouped by event, sorted by session start time.
- Each card shows: session title, event name, venue, start time, capacity status.
- Clicking a session navigates to the session detail (with registrations the staff can manage).

---

## 3.2 — Server-Side Registration Search, Filter, Sort & Paginate

> [!IMPORTANT]
> All filtering, searching, sorting, and pagination MUST happen on the server via SQL queries.
> Do NOT load all registrations into the browser and filter client-side.

### API Endpoint

```
GET /api/registrations?search=john&event=uuid&session=uuid&status=confirmed&sort=reserved_at&order=desc&page=1&limit=25
```

### Query Parameters

| Param     | Type       | Description                                            |
| --------- | ---------- | ------------------------------------------------------ |
| `search`  | `string`   | Text search over `attendee_name` and `attendee_email` (case-insensitive, partial match) |
| `event`   | `UUID`     | Filter by event ID                                     |
| `session` | `UUID`     | Filter by session ID                                   |
| `status`  | `string`   | Filter by status: `reserved`, `confirmed`, `checked_in`, `cancelled`, `expired` |
| `sort`    | `string`   | Sort field: `reserved_at`, `status`, `session`, `attendee_name` |
| `order`   | `asc|desc` | Sort direction (default: `desc`)                       |
| `page`    | `integer`  | Page number (1-indexed, default: 1)                    |
| `limit`   | `integer`  | Items per page (default: 25, max: 100)                 |

### Response Shape

```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "attendee_name": "John Doe",
      "attendee_email": "john@example.com",
      "status": "confirmed",
      "reserved_at": "2026-09-01T10:00:00Z",
      "session": {
        "id": "...",
        "title": "Keynote Address",
        "event": { "id": "...", "name": "Tech Summit 2026" }
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 25,
    "total": 142,
    "totalPages": 6
  }
}
```

### Implementation: Dynamic Query Builder

```typescript
async function findRegistrations(filters: RegistrationFilters) {
  const where: Prisma.RegistrationWhereInput = {};

  // Text search (case-insensitive)
  if (filters.search) {
    where.OR = [
      { attendee_name: { contains: filters.search, mode: 'insensitive' } },
      { attendee_email: { contains: filters.search, mode: 'insensitive' } }
    ];
  }

  // Filters
  if (filters.status) where.status = filters.status;
  if (filters.session) where.session_id = filters.session;
  if (filters.event) where.session = { event_id: filters.event };

  // Scope: staff can only see registrations for their assigned sessions
  if (user.role === 'check_in_staff') {
    const assignedSessionIds = await getAssignedSessionIds(user.id);
    where.session_id = { in: assignedSessionIds };
  }

  // Pagination
  const skip = (filters.page - 1) * filters.limit;

  const [data, total] = await Promise.all([
    prisma.registration.findMany({
      where,
      include: { session: { include: { event: true } } },
      orderBy: buildOrderBy(filters.sort, filters.order),
      skip,
      take: filters.limit
    }),
    prisma.registration.count({ where })
  ]);

  return { data, meta: { page: filters.page, limit: filters.limit, total, totalPages: Math.ceil(total / filters.limit) } };
}
```

### Database Indexes for Performance

```sql
-- Support text search on name and email
CREATE INDEX idx_reg_name_trgm ON registrations USING gin (attendee_name gin_trgm_ops);
CREATE INDEX idx_reg_email_trgm ON registrations USING gin (attendee_email gin_trgm_ops);

-- Composite index for common filter + sort patterns
CREATE INDEX idx_reg_session_status ON registrations(session_id, status);
CREATE INDEX idx_reg_status_reserved ON registrations(status, reserved_at);
```

> [!NOTE]
> Enable the `pg_trgm` extension in PostgreSQL for trigram-based text search.
> This is far more performant than `LIKE '%query%'` at scale.

### Frontend: Registration List Page

| Page                   | Route              | Description                              |
| ---------------------- | ------------------ | ---------------------------------------- |
| **All Registrations**  | `/registrations`   | Unified list with search/filter/sort/page |

#### UI Components

- **Search Bar:** Debounced text input (300ms) that updates the URL query params.
- **Filter Panel:** Dropdowns for Event, Session, Status — all populated from API.
- **Sort Controls:** Clickable column headers with ascending/descending indicators.
- **Pagination Bar:** Shows `Showing 1–25 of 142 results` with page navigation.
- **Action Buttons:** Inline Confirm / Check In / Cancel buttons per row (respecting valid transitions and role).

---

## 3.3 — CSV Bulk Import

### API Endpoint

```
POST /api/sessions/:sessionId/registrations/import
Content-Type: multipart/form-data
Body: { file: <CSV file> }
```

### CSV Format Expected

```csv
name,email
John Doe,john@example.com
Jane Smith,jane@example.com
Invalid Row,not-an-email
John Doe,john@example.com
```

### Processing Logic

```typescript
async function bulkImport(sessionId: string, csvRows: ParsedRow[]) {
  const results: ImportResult[] = [];

  for (const row of csvRows) {
    try {
      // 1. Validate row data
      if (!isValidEmail(row.email)) {
        results.push({ row: row.rowNumber, status: 'rejected', reason: 'Invalid email format', data: row });
        continue;
      }
      if (!row.name?.trim()) {
        results.push({ row: row.rowNumber, status: 'rejected', reason: 'Name is required', data: row });
        continue;
      }

      // 2. Check for duplicate (active registration with same email in this session)
      const existing = await prisma.registration.findFirst({
        where: {
          session_id: sessionId,
          attendee_email: row.email.toLowerCase(),
          status: { in: ['reserved', 'confirmed', 'checked_in'] }
        }
      });

      if (existing) {
        results.push({ row: row.rowNumber, status: 'duplicate', reason: 'Already registered for this session', data: row });
        continue;
      }

      // 3. Check capacity (per-row, within transaction for safety)
      const registration = await createReservationAtomic(sessionId, {
        attendee_name: row.name.trim(),
        attendee_email: row.email.toLowerCase().trim()
      });

      results.push({ row: row.rowNumber, status: 'created', registrationId: registration.id, data: row });

    } catch (error) {
      if (error.code === 'CAPACITY_FULL') {
        results.push({ row: row.rowNumber, status: 'rejected', reason: 'Session at full capacity', data: row });
      } else {
        results.push({ row: row.rowNumber, status: 'rejected', reason: 'Unexpected error', data: row });
      }
    }
  }

  return results;
}
```

### Response Shape

```json
{
  "success": true,
  "data": {
    "summary": { "total": 4, "created": 2, "duplicates": 1, "rejected": 1 },
    "rows": [
      { "row": 1, "status": "created", "name": "John Doe", "email": "john@example.com" },
      { "row": 2, "status": "created", "name": "Jane Smith", "email": "jane@example.com" },
      { "row": 3, "status": "rejected", "reason": "Invalid email format", "name": "Invalid Row", "email": "not-an-email" },
      { "row": 4, "status": "duplicate", "reason": "Already registered for this session", "name": "John Doe", "email": "john@example.com" }
    ]
  }
}
```

> [!IMPORTANT]
> Valid rows are still created even when other rows in the same file are rejected.
> This is NOT an all-or-nothing transaction. Each row is processed independently.

### Frontend: Import UI

- **Upload Zone:** Drag-and-drop or click-to-upload area on the session detail page.
- **CSV Template Download:** Provide a downloadable template CSV with the expected headers.
- **Import Results Modal:** After upload, display the per-row report in a table:
  - ✅ Created (green)
  - ⚠️ Duplicate (yellow)
  - ❌ Rejected with reason (red)
- **Summary Bar:** `2 created, 1 duplicate, 1 rejected out of 4 rows`

---

## 3.4 — CSV Export (Check-in Sheet)

### API Endpoint

```
GET /api/sessions/:sessionId/registrations/export
Response: text/csv attachment
```

### Generated CSV

```csv
name,email,status,reserved_at,confirmed_at,checked_in_at
John Doe,john@example.com,confirmed,2026-09-01T10:00:00Z,2026-09-01T12:00:00Z,
Jane Smith,jane@example.com,checked_in,2026-09-01T10:05:00Z,2026-09-01T12:30:00Z,2026-09-02T08:15:00Z
```

### Implementation

```typescript
app.get('/api/sessions/:id/registrations/export', authenticate, canAccessSession, async (req, res) => {
  const registrations = await prisma.registration.findMany({
    where: { session_id: req.params.id },
    orderBy: { attendee_name: 'asc' }
  });

  const csv = generateCSV(registrations, [
    'attendee_name', 'attendee_email', 'status',
    'reserved_at', 'confirmed_at', 'checked_in_at'
  ]);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="checkin-sheet-${req.params.id}.csv"`);
  res.send(csv);
});
```

### Frontend

- **Export Button:** On the session detail page, a "Download Check-in Sheet" button.
- Triggers a file download via the browser's native download mechanism.

---

## 3.5 — Phase 3 Deliverables Checklist

- [ ] `session_staff` table migrated with unique constraint
- [ ] Staff assignment/removal API endpoints (organizer-only)
- [ ] Session access middleware updated to check staff assignment
- [ ] "My Sessions" page for check-in staff
- [ ] Staff assignment UI on session detail page (organizer view)
- [ ] Registration search API with text search, filters, sort, pagination
- [ ] Trigram index enabled for performant text search
- [ ] Registrations list page with all search/filter/sort/paginate controls
- [ ] CSV import API with per-row validation and report
- [ ] CSV import UI with drag-and-drop and results display
- [ ] CSV export API returning downloadable check-in sheet
- [ ] Export button on session detail page
- [ ] Staff scoping: check-in staff only sees/searches their assigned sessions' registrations
- [ ] All new endpoints enforce role-based access on the server

---

## Key Decisions to Document (for `decisions.md`)

1. **CSV parsing library choice:** `papaparse` vs. `csv-parse` vs. hand-rolled.
2. **Bulk import atomicity:** All-or-nothing transaction vs. per-row independent processing (spec says per-row).
3. **Text search strategy:** `LIKE/ILIKE` vs. `pg_trgm` trigram index vs. full-text search (`tsvector`).
4. **Pagination style:** Offset-based (`LIMIT/OFFSET`) vs. cursor-based — and why.

> [!TIP]
> **Commit strategy for Phase 3:**
> 1. `feat: add session_staff table and assignment API`
> 2. `feat: implement session access middleware for staff`
> 3. `feat: build My Sessions page for check-in staff`
> 4. `feat: add server-side registration search with filters and pagination`
> 5. `feat: build registrations list page with search/filter UI`
> 6. `feat: implement CSV bulk import with per-row reporting`
> 7. `feat: implement CSV export for check-in sheets`
> 8. `test: add tests for bulk import validation and edge cases`
