# AI prompts

The prompts you actually used, in the order you used them, grouped by what you were trying to achieve. For each significant one: what you asked, what you got back, and what you had to correct.

Include at least one prompt that produced something wrong, and what you did about it.

If you did not use AI at all, say so here, and describe your process instead.

## Backend Schema and Setup

### Prompt
"Create a Prisma schema for an event registration system with Users (roles: ORGANIZER, CHECK_IN_STAFF, ATTENDEE), Events, Sessions (with capacity), and Registrations (with status: reserved, confirmed, checked_in, cancelled). Include a reservedAt field for the 30-minute hold."

### What you got
A robust Prisma schema with relationships defined.

### What you corrected
The AI missed adding an `isArchived` flag to the `Event` model. I manually added `isArchived Boolean @default(false)` to handle soft-deletes/archiving.

## CSV Import Parsing

### Prompt
"Write an Express controller to parse an uploaded CSV file using `csv-parse`, expecting columns 'name' and 'email', and register attendees to a session."

### What you got
A controller that read the CSV file correctly but attempted to use `createMany` for registrations without checking for existing users or capacity limits.

### What you corrected
I had to rewrite the logic to loop through each parsed record, check the session capacity, check if the email already exists in the system (or create a new ATTENDEE user), and then create the registration. I also added a summary object (total, created, duplicates, rejected) to return in the response instead of just crashing on the first duplicate.

## Frontend UI Components

### Prompt
"Create a generic Skeleton loader and an EmptyState component in React using Tailwind CSS."

### What you got
Two clean components utilizing `lucide-react` for icons and standard Tailwind utility classes.

### What you corrected
None. The output was exactly what was needed and easily integrated into the pages.
