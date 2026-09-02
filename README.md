# EventFlow — Event Registration System

A modern, full-stack event registration platform for managing multi-day conferences and workshops. Built with a focus on race-condition-safe capacity management, role-based access control, and real-time operational visibility.

## Features

- **Role-based Access Control** — Organizers and check-in staff with server-enforced permissions
- **Event & Session Management** — Create, edit, archive/restore events with sessions and seat capacity
- **Registration Lifecycle** — Reserved → Confirmed → Checked In with automatic expiry
- **Race-safe Capacity** — Atomic capacity enforcement prevents overbooking
- **Server-side Search** — Full text search, filtering, sorting, and pagination
- **Bulk Operations** — CSV import with per-row reporting, CSV export for check-in sheets
- **Analytics Dashboard** — Real-time metrics, charts, and status breakdowns
- **Immutable Audit Trail** — Append-only timeline for every registration event
- **At-Capacity Alerts** — Dismissible notifications with re-trigger logic

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| Backend | Node.js + Express + TypeScript |
| ORM | Prisma |
| Database | PostgreSQL (Supabase) |
| Auth | JWT (access + refresh tokens) + bcrypt |
| Hosting | Vercel (frontend) + Render (backend) |

## Getting Started

### Prerequisites

- Node.js v18+
- PostgreSQL (or a Supabase account)

### Setup

```bash
# Clone the repository
git clone https://github.com/nasarwaljatin/eventflow.git
cd eventflow

# Install dependencies
cd server && npm install
cd ../client && npm install

# Configure environment
cp server/.env.example server/.env
# Edit server/.env with your database URL and secrets

# Run database migrations
cd server && npx prisma migrate dev

# Seed demo data
npm run prisma:seed

# Start development servers
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
cd client && npm run dev
```

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Organizer | organizer@demo.com | Demo1234! |
| Check-in Staff | staff@demo.com | Demo1234! |

## Project Structure

```
eventflow/
├── client/          # React frontend (Vite + Tailwind)
├── server/          # Express backend (TypeScript + Prisma)
│   ├── prisma/      # Schema + migrations + seed
│   └── src/
│       ├── controllers/
│       ├── middleware/
│       ├── routes/
│       ├── schemas/
│       ├── services/
│       └── utils/
├── docs/            # Architecture, schema, decisions, plan
└── README.md
```

## Documentation

- [Architecture](docs/architecture.md)
- [Database Schema](docs/schema.md)
- [Implementation Plan](docs/plan.md)
- [Decisions Log](docs/decisions.md)
- [AI Prompts](docs/ai-prompts.md)

## License

MIT
