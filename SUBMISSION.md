# Submission

Fill this in and commit it. This is the first file we open.

## Links

- **GitHub repository:** (N/A for local exercise)
- **Live application:** (N/A for local exercise)

## Notes for the reviewer

The server runs on port 3001 and the client on 3000. Please ensure `DATABASE_URL` is set to the provided SQLite file.

## Demo credentials

| Role | Email | Password |
|------|-------|----------|
| Organizer | organizer@example.com | password123 |
| Staff | staff@example.com | password123 |
| Attendee | attendee@example.com | password123 |

## Stack

| Layer | What you used | Why |
|-------|---------------|-----|
| Frontend | React, Vite, Tailwind CSS, React Query | Fast local dev, strong caching model, easy styling. |
| Backend | Express, Node.js, Prisma, Zod | Lightweight, very strong TypeScript guarantees with Prisma. |
| Database | SQLite | File-based, easiest for reviewers to run without setup. |
| Hosting | Local | (N/A) |

## Goal checklist

Mark each honestly. Partial is fine — say what is partial.

| # | Goal | Status | Notes |
|---|------|--------|-------|
| 1 | Database setup (Events, Sessions, Users, Registrations) | Done | Designed using Prisma |
| 2 | Backend API (CRUD for events and sessions) | Done | Express routes and controllers built |
| 3 | Frontend Structure (Routing, Auth Context) | Done | Uses React Router v6 |
| 4 | Authentication (Login/Register, JWT) | Done | HttpOnly cookie-based |
| 5 | Organizer Dashboard & Management | Done | Full CRUD and assignments |
| 6 | Attendee Registration Flow (30m hold) | Done | Implemented hold mechanism and timer |
| 7 | Staff Check-in Flow | Done | Staff can view assigned sessions and check in users |
| 8 | CSV Import / Export | Done | Export works via string generation, import via `csv-parse` |
| 9 | UI Polish (Spinners, Toasts, Confirmation Dialogs) | Done | Built custom ConfirmDialog, Skeleton, Spinner |
| 10 | TypeScript Strictness | Done | Zero `any` where possible, `tsc --noEmit` passes cleanly. |

## How much time did you actually spend?

Roughly 8 hours.

## What would you do next, with another 12 hours?

- Implement WebSockets for real-time seat availability updates instead of relying on React Query polling/refetching.
- Add full end-to-end testing with Playwright or Cypress.
- Improve the email check-in flow with actual QR code generation and a scanner feature for mobile devices.
- Refactor the CSV import into a background job (e.g., BullMQ) if files get large.

## What are you least happy with in this codebase, and why?

The reservation timer logic currently resides heavily on the frontend for the countdown, and the backend relies on synchronous checks when a user attempts an action. While this prevents invalid states, it means reservations expire "lazily" when interacted with, rather than via a cron job that cleans them up automatically. A dedicated background worker for expiring old holds would be much cleaner.
