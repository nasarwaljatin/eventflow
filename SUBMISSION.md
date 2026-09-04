# Submission

Fill this in and commit it. This is the first file we open.

## Links

- **GitHub repository:** https://github.com/nasarwaljatin/eventflow.git
- **Live application:** https://eventflow-sage-ten.vercel.app

## Notes for the reviewer

The server runs on port 3000 and the client on 5173 (or Vercel in production).

## Demo credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@eventflow.com | Admin1234! |
| Organizer | organizer@demo.com | Demo1234! |
| Check-in Staff | staff1@demo.com | Demo1234! |

## Stack

| Layer | What you used | Why |
|-------|---------------|-----|
| Frontend | React, Vite, Tailwind CSS, React Query, @react-oauth/google | Fast local dev, strong caching model, easy styling, Google SSO. |
| Backend | Express, Node.js, Prisma, Zod, google-auth-library | Lightweight, strong TypeScript guarantees with Prisma, secure Google token verification. |
| Database | PostgreSQL (Supabase) | Scalable relational database with connection pooling. |
| Hosting | Vercel (frontend) + Render (backend) | Automated CI/CD deployments. |

## Goal checklist

| # | Goal | Status | Notes |
|---|------|--------|-------|
| 1 | Database setup (Events, Sessions, Users, Registrations, Approval) | Done | Designed using Prisma + PostgreSQL |
| 2 | Backend API (CRUD for events and sessions, Admin approvals) | Done | Express routes and controllers built |
| 3 | Frontend Structure (Routing, Auth Context, Admin Dashboard) | Done | Uses React Router v6 + RoleGuard |
| 4 | Authentication (Login/Register, JWT, Google SSO) | Done | JWT + Google OAuth 2.0 |
| 5 | Admin Event Approval & User Role Management | Done | Admin dashboard with event approvals & user role switcher |
| 6 | Organizer Dashboard & Management | Done | Full CRUD and staff assignments |
| 7 | Attendee Registration Flow (30m hold) | Done | Implemented hold mechanism and timer |
| 8 | Staff Check-in Flow | Done | Staff can view assigned sessions and check in users |
| 9 | CSV Import / Export | Done | Export works via CSV generation, import via `csv-parse` |
| 10 | UI Polish (Spinners, Toasts, Confirmation Dialogs, Setup Modal) | Done | Built custom ConfirmDialog, GoogleAuthButton setup modal |
| 11 | TypeScript Strictness | Done | Strict type-checking, `tsc --noEmit` passes cleanly. |

## How much time did you actually spend?

Roughly 8 hours.

## What would you do next, with another 12 hours?

- Implement WebSockets for real-time seat availability updates instead of relying on React Query polling/refetching.
- Add full end-to-end testing with Playwright or Cypress.
- Improve the email check-in flow with actual QR code generation and a scanner feature for mobile devices.
- Refactor the CSV import into a background job (e.g., BullMQ) if files get large.

## What are you least happy with in this codebase, and why?

The reservation timer logic currently resides heavily on the frontend for the countdown, and the backend relies on synchronous checks when a user attempts an action. While this prevents invalid states, it means reservations expire "lazily" when interacted with, rather than via a cron job that cleans them up automatically. A dedicated background worker for expiring old holds would be much cleaner.
