# Architecture

## Overview
EventFlow uses a three-tier architecture, deployed on free-tier services.

### Diagram
```mermaid
graph TD
    Client[Browser (React)] -->|HTTPS API Requests| Vercel[Vercel Frontend]
    Vercel -->|HTTPS REST| Render[Render Web Service]
    Render -->|TCP/Postgres| Supabase[Supabase Database]
```

### Components
- **Frontend (Vercel)**: React + Vite + Tailwind application. Handles UI and optimistic updates.
- **Backend (Render)**: Node.js + Express backend. Provides REST APIs. Contains business logic.
- **Database (Supabase)**: PostgreSQL database via Supabase. Managed using Prisma ORM.

### Request Flow: "User checks in an attendee"
1. Check-in staff scans/finds attendee in the frontend and clicks "Check In".
2. The frontend sends a `PATCH /api/registrations/:id/status` request with `status: checkedIn` to the Render backend.
3. The Express controller verifies the user's JWT (Auth Middleware) and ensures the user has permission to manage this session.
4. The controller starts a Prisma transaction:
   - Locks the registration row (`SELECT FOR UPDATE`).
   - Verifies the state machine transition (e.g. from `confirmed` to `checked-in`).
   - Updates the row and logs the action in the `audit_log` table.
5. The backend responds with `200 OK`.
6. The frontend receives the response and updates the UI state to reflect the new checked-in status.

### What We Deferred
- **WebSocket / Real-time updates**: We opted for HTTP REST with optimistic updates to simplify architecture and hosting constraints (Render free tier sleeps and drops WS connections).
- **Email Notifications**: Deferred to focus on core check-in logic and state machine.
