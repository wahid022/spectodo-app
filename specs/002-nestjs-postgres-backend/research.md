# Research: Backend-Powered Todo App

**Branch**: `002-nestjs-postgres-backend` | **Date**: 2026-05-18

## Decision 1 — Backend Framework

**Decision**: NestJS 10.x on Node.js 20 LTS

**Rationale**: NestJS provides a structured, opinionated framework with built-in
support for TypeScript decorators, dependency injection, DTO validation via
`class-validator`, and modular architecture. It is the framework named in the
constitution (Principle I) and has first-class Prisma integration guides. Node.js 20
LTS is supported by both Railway and Render free tiers.

**Alternatives considered**:
- Express.js — too low-level; no built-in DI, validation, or module system
- Fastify standalone — lacks the decorator/module ecosystem; more setup overhead
- Hono — lighter but not constitution-aligned; no official NestJS-style patterns

---

## Decision 2 — ORM and Migration Tooling

**Decision**: Prisma 5.x (`@prisma/client` + Prisma CLI)

**Rationale**: Prisma is named in the constitution (Principle I). It provides a
type-safe generated client, declarative schema (`schema.prisma`), and a migration
system that produces SQL files under version control — directly satisfying
Principle III (Database Integrity). `prisma migrate deploy` runs cleanly in CI and
on Railway/Render startup scripts.

**Alternatives considered**:
- TypeORM — decorator-heavy, configuration-verbose, less type-safe than Prisma
- Drizzle ORM — excellent type safety but less mature migration tooling; not
  specified in constitution

---

## Decision 3 — Task Identifier Strategy

**Decision**: Prisma `cuid()` as the default `@id` strategy

**Rationale**: `cuid()` produces collision-resistant IDs that are shorter than
UUID v4, URL-safe, and sortable by generation order. They work out of the box in
Prisma schema without an extension. No sequential integer IDs are used to avoid
exposing the total task count via predictable IDs.

**Alternatives considered**:
- `uuid()` — equally valid but longer strings; chosen as acceptable alternative
- Auto-increment integer — exposes total record count; not suitable for public APIs

---

## Decision 4 — DTO Validation Strategy

**Decision**: `class-validator` + `class-transformer` + NestJS `ValidationPipe`
applied globally in `main.ts` with `whitelist: true, forbidNonWhitelisted: true`

**Rationale**: This is the standard NestJS validation pattern. `@IsString()`,
`@IsNotEmpty()`, `@MaxLength(255)`, and `@IsBoolean()` decorators map directly
to the spec's FR-001, FR-002, FR-002a, and FR-005. Global `ValidationPipe` ensures
no endpoint can receive unvalidated input.

**Alternatives considered**:
- Manual validation in controllers — error-prone; duplicates logic per endpoint
- Zod schemas — not native to NestJS; requires adapter; adds dependency

---

## Decision 5 — CORS Configuration

**Decision**: NestJS `app.enableCors({ origin: process.env.FRONTEND_URL })` in
`main.ts`; `FRONTEND_URL` supplied as an environment variable

**Rationale**: Cross-origin is required (clarification Q5) since the frontend and
backend deploy to separate domains on Railway/Render. Restricting to the frontend's
exact domain (via env var) satisfies FR-011 (reject all other origins) while keeping
the value configurable without code changes (Principle VI).

**Alternatives considered**:
- `origin: '*'` — overly permissive; violates FR-011
- Next.js `rewrites` proxy — would share an origin but requires the backend to
  be accessible from the Next.js server at build time; complicates Railway/Render
  deployment topology

---

## Decision 6 — API Response Shape

**Decision**: Plain entity object for success responses; NestJS default exception
filter shape `{ statusCode, message, error }` for error responses

**Rationale**: A flat entity return (no wrapper object like `{ data: ... }`) is
simpler for a 4-endpoint API of this scale. The NestJS default exception filter
already produces a consistent error shape, which the frontend can key on
`statusCode` to display user-facing messages.

**Alternatives considered**:
- JSend / envelope pattern (`{ status, data }`) — more consistent for larger APIs
  but adds boilerplate for a 4-endpoint surface

---

## Decision 7 — Task Ordering

**Decision**: Server-side ordering via `orderBy: { createdAt: 'desc' }` in
`prisma.task.findMany()`

**Rationale**: Ordering on the server eliminates any client-side sort logic and
ensures `GET /tasks` always returns a correctly ordered array regardless of the
frontend implementation. This directly satisfies FR-003 and Principle VIII (UI
Behavior Rules — newest first).

**Alternatives considered**:
- Client-side sort after fetch — adds logic to the frontend layer, violating
  Principle II (Single Responsibility Design)

---

## Decision 8 — Frontend API Client

**Decision**: Native `fetch` wrapped in `lib/api.ts` with typed helper functions;
`NEXT_PUBLIC_API_URL` environment variable points to the NestJS backend URL

**Rationale**: Native `fetch` is available in Node 18+ and all modern browsers
without additional dependencies. Centralising all HTTP calls in `lib/api.ts`
(replacing `lib/storage.ts`) keeps the frontend layer clean and satisfies
Principle X (Maintainability). `NEXT_PUBLIC_` prefix makes the variable available
client-side in Next.js without any config changes.

**Alternatives considered**:
- Axios — adds a dependency for no meaningful benefit at this scale
- React Query / SWR — useful for caching/revalidation but unnecessary complexity
  for a single-user app with ~500 tasks

---

## Decision 9 — Deployment Strategy

**Decision**: Backend deployed to Railway (or Render) as a Node.js service with
a PostgreSQL plugin; frontend deployed as a separate Next.js static/SSR service

**Rationale**: Railway provides a PostgreSQL plugin that auto-injects `DATABASE_URL`
into the backend service, eliminating manual connection-string management. Render
offers an equivalent PostgreSQL add-on. Both support the `npm run start:prod`
command with `prisma migrate deploy && node dist/main` as the release command.

**Start command for backend**:
```bash
npx prisma migrate deploy && node dist/main.js
```

**Alternatives considered**:
- Single Railway service serving both frontend and backend — violates
  Principle II (Single Responsibility Design)
- Self-hosted PostgreSQL — not free-tier friendly; operational overhead

---

## Decision 10 — Error Handling Pattern

**Decision**: Try/catch in each NestJS service method; re-throw as NestJS
`HttpException` (400/404/500 as appropriate); frontend catches non-2xx responses
and surfaces error message + retry button per FR-008

**Rationale**: NestJS built-in `HttpException` subclasses (`BadRequestException`,
`NotFoundException`) produce the standard error shape automatically. On the
frontend, a centralized error handler in `lib/api.ts` converts non-2xx responses
into a thrown `Error` with the backend's message, which the component catches and
stores in state for display.

**Alternatives considered**:
- Global exception filter with custom serialisation — adds boilerplate; the
  default NestJS filter is sufficient for this surface area
