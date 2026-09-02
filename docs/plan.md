# Plan

Answer each of these, in your own words.

- How did you break the work into sessions?
  I broke the work into logical full-stack features: 
  1. Base Setup & Auth (Setting up React, Express, Prisma, auth flows).
  2. Core Entities (Events & Sessions with CRUD and Organizer roles).
  3. Registration & Attendee Flow (The booking and check-in mechanism).
  4. Advanced Features (CSV imports, Check-in exports, Role access).
  5. UI Polish & Documentation (Loading states, toast notifications, confirmation dialogs, empty states).

- What order did you build in, and why that order?
  I built the backend foundations and auth first, as everything depends on roles and user identity. Then I built events and sessions (the core domain), followed by registrations (which depend on sessions). Lastly, I added advanced workflows like imports and final UI polish once the core logic was stable.

- What did you estimate versus what it actually took?
  I estimated about 1-2 hours per phase. The time spent closely mirrored the estimate, though resolving some edge cases in CSV parsing and TS compiler strictness added minor overhead.

- What did you cut when you ran short?
  I kept it simple by using a basic polling mechanism for the countdown timer rather than WebSockets, which saved significant setup time but still delivered the required UX.
