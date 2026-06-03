# Implementation Plan: Backend-Powered Todo App

**Branch**: `002-nestjs-postgres-backend` | **Date**: 2026-05-18 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-nestjs-postgres-backend/spec.md`

## Summary

Upgrade the existing Next.js 14 Todo App from client-side localStorage persistence
to a full-stack architecture. A new NestJS 10 backend replaces localStorage with
PostgreSQL (via Prisma ORM), exposing four RESTful CRUD endpoints. The Next.js
frontend is refactored to consume the API, display a loading indicator on fetch,
show retry-able error states, and enforce newest-first task ordering from the server.
Both services deploy independently to free-tier platforms (Railway/Render) with all
configuration supplied through environment variables.

## Technical Context

**Language/Version**: TypeScript 5.x — Node.js 20 LTS (both frontend and backend)

**Primary Dependencies**:
- Backend: NestJS 10.x, `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`,
  `class-validator`, `class-transformer`, `@prisma/client`, `prisma`
- Frontend: Next.js 14.x (existing), React 18, Tailwind CSS 3.x (existing)
- Database tooling: Prisma CLI 5.x

**Storage**: PostgreSQL 16 accessed exclusively through Prisma ORM

**Testing**: Jest + Supertest (NestJS default); no frontend test suite in scope

**Target Platform**: Linux server (Railway / Render free tier); modern browser for frontend

**Project Type**: Web application — separate backend service + existing Next.js frontend

**Performance Goals**: All API responses < 500ms p95; UI reflects changes within 2 seconds of
user action (per SC-001 through SC-003)

**Constraints**:
- Free-tier deployment (Railway or Render); no paid infra
- No authentication; single shared task list
- CORS required: backend allows requests only from the frontend's deployed domain
- All secrets via environment variables; no hardcoded credentials
- Task title: 1–255 characters; full list loaded per request (no pagination, ~500 task ceiling)

**Scale/Scope**: Single user; up to ~500 tasks; 1 database table; 4 API endpoints

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. Backend-First Architecture | NestJS backend + PostgreSQL + Prisma; no localStorage for persistence | ✅ Pass |
| II. Single Responsibility Design | Next.js handles UI only; NestJS handles all logic, validation, DB | ✅ Pass |
| III. Database Integrity | Prisma schema with `id`, `title`, `completed`, `createdAt`, `updatedAt`; migrations only | ✅ Pass |
| IV. API Consistency | All 4 REST endpoints defined; NestJS DTOs + ValidationPipe; consistent response shape | ✅ Pass |
| V. Simplicity Over Feature Creep | Only CRUD for tasks; auth, editing, due dates explicitly excluded | ✅ Pass |
| VI. Deployment Readiness | `.env.example` provided; Railway/Render compatible; no hardcoded secrets | ✅ Pass |
| VII. Development Workflow | All 4 validation gates exercised during implementation | ✅ Pass |
| VIII. UI Behavior Rules | Newest-first (server-ordered); whitespace rejected; immediate delete; completed stays | ✅ Pass |
| IX. Error Handling | Error + retry button on failure; backend logs all errors | ✅ Pass |
| X. Maintainability | NestJS module structure; organized frontend components and API client | ✅ Pass |

**Verdict**: All 10 constitution gates pass. Proceeding to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/002-nestjs-postgres-backend/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── api.md           # Phase 1 output — REST API contract
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created here)
```

### Source Code (repository root)

```text
backend/                          # NEW — NestJS application (separate service)
├── src/
│   ├── tasks/
│   │   ├── tasks.module.ts
│   │   ├── tasks.controller.ts
│   │   ├── tasks.service.ts
│   │   └── dto/
│   │       ├── create-task.dto.ts
│   │       └── update-task.dto.ts
│   ├── prisma/
│   │   └── prisma.service.ts
│   └── main.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── .env.example
├── package.json
└── tsconfig.json

app/                              # EXISTING Next.js frontend (refactored)
├── page.tsx                      # Main page at "/" — refactored to use API
├── components/
│   ├── TaskForm.tsx              # Input form with validation
│   ├── TaskList.tsx              # List with loading/error/empty states
│   ├── TaskItem.tsx              # Individual task row (toggle + delete)
│   └── ErrorBanner.tsx          # Error message + retry button

lib/
└── api.ts                        # API client — fetch wrapper for backend calls
```

**Structure Decision**: Web application layout (Option 2 adapted). Backend is a new
`backend/` directory at the repo root, deployed as a separate service. The existing
Next.js app retains its current root-level structure; `lib/storage.ts` (localStorage)
is replaced by `lib/api.ts` (fetch client).

## Complexity Tracking

> No constitution violations to justify — all gates pass cleanly.
