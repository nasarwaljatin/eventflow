# Decisions

Log the decisions that actually shaped this codebase — the ones where a real alternative existed and
you picked one. At least five entries. For each: what you chose, what you rejected, and why. At least
one entry must be a decision you later reversed — say what changed your mind. It can be any entry
below, not necessarily the last one; add a **Later reversed:** line to whichever one it is.

## Decision 1

- **Chose:** Prisma as the ORM.
- **Rejected:** Raw SQL or TypeORM.
- **Why:** Prisma offers excellent type safety with TypeScript out of the box and auto-generates types. It was the fastest way to model the schema and get strongly typed queries on the backend without writing tedious boilerplates.

## Decision 2

- **Chose:** React Hook Form with Zod for form validation.
- **Rejected:** Formik or manual state management.
- **Why:** React Hook Form is performant and reduces re-renders. Paired with Zod, it provides robust, schema-driven validation that mirrors backend validation types well.

## Decision 3

- **Chose:** JWT (JSON Web Tokens) in HttpOnly cookies for authentication.
- **Rejected:** LocalStorage JWT or session-based auth.
- **Why:** Storing JWT in an HttpOnly cookie significantly improves security by mitigating XSS attacks, while still being stateless on the backend.

## Decision 4

- **Chose:** Tailwind CSS for styling.
- **Rejected:** Styled Components or raw CSS modules.
- **Why:** Tailwind allows for rapid prototyping and utility-first styling without context-switching between TSX and CSS files. It naturally encourages consistency via its design tokens.
- **Later reversed:** Initially planned to use arbitrary values heavily in Tailwind for pixel-perfect matches, but reversed this to stick strictly to standard Tailwind spacing and color scales to ensure UI consistency and maintainability.

## Decision 5

- **Chose:** TanStack React Query for data fetching.
- **Rejected:** Redux or simple `useEffect` with fetch.
- **Why:** React Query handles caching, background updates, loading states, and mutations elegantly. Building this manually with useEffect would be error-prone and complex, especially for features like the reservation timer.
