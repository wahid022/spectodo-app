<!--
Sync Impact Report
==================
Version change: 3.0.0 → 4.0.0 (MAJOR)
Rationale: Complete architectural overhaul from client-side-only Next.js/localStorage
  stack to a full-stack NestJS + PostgreSQL + Prisma application. Principles I–V
  are all superseded or substantially redefined. Five new principles (VI–X) added.
  Development Workflow and Quality Gates updated to reflect backend validation gates.

Modified principles:
  - I. Client-Side Only Stack → I. Backend-First Architecture
      (Next.js/localStorage replaced by NestJS/PostgreSQL/Prisma)
  - II. Code Organisation → II. Single Responsibility Design
      (file layout rules replaced by frontend/backend separation mandate)
  - III. Styling Discipline → III. Database Integrity
      (Tailwind-only CSS constraint replaced by PostgreSQL/Prisma data rules)
  - IV. Data Conventions → IV. API Consistency
      (localStorage shape/key rules replaced by RESTful API contracts)
  - V. UI Behaviour → V. Simplicity Over Feature Creep
      (retained scope rules expanded to explicit in/out-of-scope list)

Added sections:
  - VI. Deployment Readiness (new principle)
  - VII. Development Workflow (promoted from section to numbered principle)
  - VIII. UI Behavior Rules (new principle; replaces behavioural rules from old V)
  - IX. Error Handling (new principle)
  - X. Maintainability (new principle)

Removed sections:
  - Development Workflow (standalone section — now embedded as Principle VII)

Templates reviewed:
  - .specify/templates/plan-template.md ✅ no update needed
    (Constitution Check section is filled dynamically at plan time)
  - .specify/templates/spec-template.md ✅ no update needed
    (generic template; no constitution-specific references)
  - .specify/templates/tasks-template.md ✅ no update needed
    (generic template; no constitution-specific references)
  - No commands directory found in .specify/templates/ — skipped

Feature artifacts requiring manual follow-up:
  - specs/001-todo-app/plan.md ⚠ PENDING
    References client-side-only architecture (localStorage, no backend).
    Must be regenerated via /speckit-plan.
  - specs/001-todo-app/spec.md ⚠ PENDING
    Functional requirements reflect localStorage-based app. Must be updated
    or regenerated to reflect the NestJS + PostgreSQL backend.
  - specs/001-todo-app/tasks.md ⚠ PENDING
    All tasks reference client-side implementation. Must be regenerated
    via /speckit-tasks.
  - specs/001-todo-app/research.md ⚠ PENDING
    Architecture decisions reference client-side-only stack. Must be regenerated.

Follow-up TODOs: None — all fields resolved.
-->

# Todo App Constitution

## Core Principles

### I. Backend-First Architecture

The application MUST use NestJS as the primary backend framework with PostgreSQL
as the main database and Prisma ORM for all database access.

- Stack: Next.js (frontend), NestJS (backend), PostgreSQL, Prisma ORM, TypeScript.
- `localStorage` MUST NOT be used for task persistence; it is prohibited except
  as a temporary fallback during initial development only.
- All persistent state MUST reside in PostgreSQL, accessed exclusively through
  Prisma.
- No alternative ORMs, databases, or server frameworks are permitted without a
  constitution amendment.

**Rationale**: A dedicated backend separates concerns cleanly, ensures data
durability across sessions and devices, and makes the application deployment-ready
on production infrastructure.

### II. Single Responsibility Design

Frontend and backend responsibilities MUST remain clearly separated at all times.

- The Next.js frontend MUST handle only UI rendering and user interactions.
- The NestJS backend MUST handle all business logic, input validation,
  database operations, and API response formatting.
- Business logic and database access code MUST NOT appear inside the
  Next.js frontend layer.

**Rationale**: Clear separation prevents coupling, makes each layer independently
testable, and allows the frontend and backend to evolve without breaking each other.

### III. Database Integrity

All task operations MUST persist in PostgreSQL through Prisma with a defined schema.

- Every task entity MUST include: `id` (unique), `title` (string), `completed`
  (boolean), `createdAt` (timestamp), `updatedAt` (timestamp).
- Prisma schema changes MUST always be managed through Prisma migrations;
  direct DDL edits to the database are strictly prohibited.
- Seeding, schema resets, or direct SQL modifications outside of Prisma
  migrations MUST NOT be applied in production environments.

**Rationale**: Prisma migrations provide an auditable, reproducible schema history.
Without this discipline, schema drift causes data loss and deployment failures.

### IV. API Consistency

All backend endpoints MUST follow RESTful standards with these exact contracts:

- `POST /tasks` — create a new task
- `GET /tasks` — fetch all tasks
- `PATCH /tasks/:id` — toggle task complete / incomplete
- `DELETE /tasks/:id` — delete a task

All APIs MUST:

- Validate all inputs using NestJS DTOs and validation pipes.
- Return a consistent response structure across all endpoints.
- Return meaningful error messages and appropriate HTTP status codes.

**Rationale**: Consistent API contracts allow the frontend to consume endpoints
predictably and make integration testing straightforward.

### V. Simplicity Over Feature Creep

The following features are allowed within scope:

- Add task
- View task list
- Mark task complete / undo complete
- Delete task
- Persistent storage in PostgreSQL
- Task reminders and browser notifications
- Alarm tone playback for reminders
- Responsive card-based task UI improvements

The following remain out of scope:

- Authentication or authorisation
- File uploads
- Multi-user support

**Rationale**: A tightly bounded scope keeps the codebase small, testable, and
shippable. Scope creep introduces complexity that outpaces the value delivered.

### VI. Deployment Readiness

The backend MUST be deployable to free-tier platforms such as Railway or Render
without any source code changes.

- All secrets and database configuration MUST be supplied through environment
  variables; never hardcoded.
- Hardcoded credentials, connection strings, or secrets in source code are
  strictly prohibited.
- A `.env.example` file MUST document every required environment variable
  with a descriptive placeholder value.

**Rationale**: Deployment-ready code from day one prevents last-minute surprises
and enables continuous delivery to staging or production environments at any time.

### VII. Development Workflow

No code MUST be merged without passing all of the following validation gates:

1. **Prisma migration validation**: schema changes applied cleanly via migration.
2. **API endpoint testing**: each endpoint verified against expected inputs/outputs.
3. **Frontend integration testing**: UI correctly consumes all backend API responses.
4. **Manual persistence check**: tasks survive a full browser refresh
   (data confirmed in PostgreSQL, not in browser storage).

**Rationale**: Each gate catches a distinct failure mode. Skipping any gate risks
shipping bugs that are expensive to diagnose in a deployed environment.

### VIII. UI Behavior Rules

The frontend MUST implement these non-negotiable behavioral rules:

- Newest tasks MUST appear at the top of the list (newest-first ordering).
- Empty or whitespace-only task titles MUST be rejected before submission.
- Delete operations MUST be immediate with no confirmation popup.
- Completed tasks MUST remain visible in their original position — they are
  never removed or hidden.
- Task items MUST render as responsive card-based UI components.
- The UI MUST remain fully responsive across mobile, tablet, and desktop layouts.
- Reminder-triggered tasks MUST display a visual highlighted state.
- Alarm notifications MUST provide both visual and audio feedback.
- Task cards SHOULD include smooth hover and transition animations.

**Rationale**: These rules define the exact user-facing contract. Deviating from
them changes observable behavior and breaks acceptance tests.

### IX. Error Handling

The application MUST surface all failures clearly and explicitly to the user.

- If a database connection fails or any API call returns an error, the UI
  MUST display a clear, user-facing error message rather than failing silently.
- Swallowed exceptions, empty catch blocks, and missing error states are
  prohibited.
- The backend MUST log all errors with sufficient context for diagnosis.

**Rationale**: Silent failures erode user trust and make bugs nearly impossible
to diagnose. Visible, informative errors help both users and developers respond
quickly.

### X. Maintainability

All code MUST remain modular, readable, and production-ready at all times.

- The NestJS backend MUST follow proper module structure: services, controllers,
  modules, and Prisma client setup each in their designated locations.
- The Next.js frontend MUST organise components and API client code in
  predictable, consistently named directories.
- Shared logic MUST NOT be duplicated across modules; shared utilities MUST
  be extracted to a common location.

**Rationale**: Maintainability is a first-class requirement. Code that cannot be
understood or safely modified accumulates technical debt that compounds over time.

## Quality Gates

Before any feature is considered complete, all of the following MUST pass:

1. **Build**: Both backend (`nest build`) and frontend (`npm run build`) MUST
   succeed with zero TypeScript errors.
2. **Migrations**: All Prisma migrations MUST apply cleanly against a fresh database.
3. **API contracts**: All four endpoints MUST respond correctly to both valid and
   invalid inputs.
4. **Persistence**: Tasks MUST survive a browser refresh; data MUST be in PostgreSQL,
   not in any browser storage mechanism.
5. **UI behavior**: All four rules in Principle VIII MUST be visually verified
   in the browser before marking a task complete.

## Governance

- This constitution supersedes all other development guidance for this project.
- Amendments MUST be documented with a version bump, a rationale, and a migration
  note if existing code is affected.
- **MAJOR** bump: removal or backward-incompatible redefinition of a principle.
- **MINOR** bump: new principle or section added, or materially expanded guidance.
- **PATCH** bump: clarification, wording fix, or non-semantic refinement.
- All pull requests and code reviews MUST verify compliance with these principles
  before merging.

**Version**: 4.0.0 | **Ratified**: 2026-05-15 | **Last Amended**: 2026-05-18
