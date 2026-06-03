---
description: "Task list for Backend-Powered Todo App"
---

# Tasks: Backend-Powered Todo App

**Input**: Design documents from `/specs/002-nestjs-postgres-backend/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/api.md ✅ | quickstart.md ✅

**Tests**: Not requested — no test tasks generated.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Every task includes an exact file path

## Path Conventions

- Backend: `backend/src/`, `backend/prisma/`
- Frontend: `app/`, `lib/` (at repo root — existing Next.js structure)

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Initialize the NestJS backend project and clean up the legacy localStorage frontend.

- [x] T001 Create `backend/package.json` with NestJS 10 core dependencies: `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`, `class-validator`, `class-transformer`, `reflect-metadata`, `rxjs`, `@prisma/client`, `prisma`; devDependencies: `@nestjs/cli`, `@nestjs/schematics`, `typescript`, `ts-node`, `ts-loader`, `@types/node`, `@types/express`
- [x] T002 [P] Create `backend/tsconfig.json` with `target: ES2021`, `module: commonjs`, `emitDecoratorMetadata: true`, `experimentalDecorators: true`, `strict: true`, `outDir: dist`
- [x] T003 [P] Create `backend/nest-cli.json` with `{ "collection": "@nestjs/schematics", "sourceRoot": "src" }`
- [x] T004 [P] Create `backend/.env.example` with three variables: `DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME`, `FRONTEND_URL=http://localhost:3000`, `PORT=3001`
- [x] T005 [P] Create `backend/.env` (local only, gitignored) from `backend/.env.example` filled with a local PostgreSQL connection string
- [x] T006 [P] Delete `lib/storage.ts` (localStorage implementation) and create `lib/api.ts` as an empty module that exports a typed `Task` interface and a `BASE_URL` constant reading from `process.env.NEXT_PUBLIC_API_URL`
- [x] T007 [P] Create `app/.env.local` (gitignored) with `NEXT_PUBLIC_API_URL=http://localhost:3001`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core backend infrastructure that ALL user story implementations depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T008 Create `backend/prisma/schema.prisma` with datasource block pointing to `env("DATABASE_URL")`, generator block for `@prisma/client`, and `model Task` with fields: `id String @id @default(cuid())`, `title String @db.VarChar(255)`, `completed Boolean @default(false)`, `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt`
- [x] T009 Run `npx prisma migrate dev --name init` inside `backend/` to generate and apply the initial migration; confirm `backend/prisma/migrations/` directory is created
- [x] T010 Create `backend/src/prisma/prisma.service.ts` — injectable `PrismaService` that extends `PrismaClient` and calls `this.$connect()` in `onModuleInit`
- [x] T011 [P] Create `backend/src/prisma/prisma.module.ts` — `@Global()` module that provides and exports `PrismaService`
- [x] T012 [P] Create `backend/src/tasks/dto/create-task.dto.ts` — class `CreateTaskDto` with property `title: string` decorated with `@IsString()`, `@IsNotEmpty()`, `@MaxLength(255)`
- [x] T013 [P] Create `backend/src/tasks/dto/update-task.dto.ts` — class `UpdateTaskDto` with property `completed: boolean` decorated with `@IsBoolean()`
- [x] T014 Create `backend/src/tasks/tasks.module.ts` — `@Module` that imports `PrismaModule`, declares `TasksController` and provides `TasksService`
- [x] T015 Create `backend/src/app.module.ts` — root `AppModule` that imports `PrismaModule` and `TasksModule`
- [x] T016 Create `backend/src/main.ts` — bootstraps `AppModule`, calls `app.enableCors({ origin: process.env.FRONTEND_URL })`, applies global `ValidationPipe` with `{ whitelist: true, forbidNonWhitelisted: true }`, and listens on `process.env.PORT ?? 3001`

**Checkpoint**: Foundation ready — `npm run start:dev` in `backend/` starts without errors; `GET http://localhost:3001/tasks` returns 404 (no routes yet).

---

## Phase 3: User Story 1 — Add and View Tasks (Priority: P1) 🎯 MVP

**Goal**: Users can create tasks and see all tasks listed newest-first; data persists across browser refreshes.

**Independent Test**: Open app at `http://localhost:3000`; add three tasks; refresh browser — all three appear in newest-first order with no data loss.

### Implementation for User Story 1

- [x] T017 [US1] Create `backend/src/tasks/tasks.service.ts` — injectable `TasksService` that injects `PrismaService`; implement `create(dto: CreateTaskDto): Promise<Task>` calling `this.prisma.task.create({ data: { title: dto.title } })` and `findAll(): Promise<Task[]>` calling `this.prisma.task.findMany({ orderBy: { createdAt: 'desc' } })`
- [x] T018 [US1] Create `backend/src/tasks/tasks.controller.ts` — `@Controller('tasks')` with `@Post()` handler calling `tasksService.create(dto)` returning 201, and `@Get()` handler calling `tasksService.findAll()` returning 200; inject `TasksService`
- [x] T019 [P] [US1] Implement `getAllTasks(): Promise<Task[]>` in `lib/api.ts` — fetch `GET ${BASE_URL}/tasks`, throw `Error` with response message on non-2xx
- [x] T020 [P] [US1] Implement `createTask(title: string): Promise<Task>` in `lib/api.ts` — fetch `POST ${BASE_URL}/tasks` with `{ title }` body, throw `Error` with response message on non-2xx
- [x] T021 [US1] Create `app/components/TaskList.tsx` — `"use client"`; accepts `tasks: Task[]`, `isLoading: boolean`, and `onToggle`/`onDelete` prop placeholders; renders loading spinner div when `isLoading`, empty-state message when list is empty, or an unordered list of task titles
- [x] T022 [US1] Create `app/components/TaskForm.tsx` — `"use client"`; controlled text input; on submit validates non-empty/non-whitespace title, calls `createTask()`, invokes `onAdd(task)` prop callback, clears input; shows inline validation message if empty
- [x] T023 [US1] Refactor `app/page.tsx` — `"use client"`; `useState` for `tasks`, `isLoading`, `error`; `useEffect` on mount calls `getAllTasks()` setting loading true then false; render `TaskForm` with `onAdd` handler that prepends new task to state; render `TaskList` with tasks and loading state

**Checkpoint**: User Story 1 fully functional — add tasks, refresh, data persists from PostgreSQL. `localStorage` not involved.

---

## Phase 4: User Story 2 — Toggle Task Completion (Priority: P2)

**Goal**: Users can mark tasks complete and undo; completion persists across refreshes; completed tasks stay in position with visual indicator.

**Independent Test**: Add a task, mark it complete (strikethrough appears), refresh — task still shows as complete in its original position.

### Implementation for User Story 2

- [x] T024 [US2] Add `toggle(id: string, dto: UpdateTaskDto): Promise<Task>` to `backend/src/tasks/tasks.service.ts` — calls `this.prisma.task.update({ where: { id }, data: { completed: dto.completed } })`; wraps in try/catch to throw `NotFoundException('Task not found')` if Prisma throws P2025
- [x] T025 [US2] Add `@Patch(':id')` handler to `backend/src/tasks/tasks.controller.ts` — extracts `id` from params, accepts `UpdateTaskDto` body, calls `tasksService.toggle(id, dto)`, returns 200
- [x] T026 [P] [US2] Add `toggleTask(id: string, completed: boolean): Promise<Task>` to `lib/api.ts` — fetch `PATCH ${BASE_URL}/tasks/${id}` with `{ completed }` body, throw `Error` on non-2xx
- [x] T027 [US2] Create `app/components/TaskItem.tsx` — `"use client"`; renders task row with a checkbox (checked when `task.completed`), task title (Tailwind `line-through` class when completed), and a delete button placeholder; calls `onToggle(task.id, !task.completed)` on checkbox change
- [x] T028 [US2] Update `app/components/TaskList.tsx` to render `TaskItem` components instead of plain list items, passing `onToggle` and `onDelete` props through
- [x] T029 [US2] Update `app/page.tsx` to pass `onToggle` handler to `TaskList`; handler calls `toggleTask()` and updates the matching task in state by mapping over tasks

**Checkpoint**: User Stories 1 and 2 both independently functional and testable.

---

## Phase 5: User Story 3 — Delete a Task (Priority: P2)

**Goal**: Users can delete a task immediately with no confirmation; deletion is permanent.

**Independent Test**: Add a task, click delete — task disappears instantly. Refresh — task does not reappear.

### Implementation for User Story 3

- [x] T030 [US3] Add `remove(id: string): Promise<Task>` to `backend/src/tasks/tasks.service.ts` — calls `this.prisma.task.delete({ where: { id } })`; wraps in try/catch to throw `NotFoundException('Task not found')` if Prisma throws P2025
- [x] T031 [US3] Add `@Delete(':id')` handler to `backend/src/tasks/tasks.controller.ts` — extracts `id` from params, calls `tasksService.remove(id)`, returns 200 with deleted entity
- [x] T032 [P] [US3] Add `deleteTask(id: string): Promise<Task>` to `lib/api.ts` — fetch `DELETE ${BASE_URL}/tasks/${id}`, throw `Error` on non-2xx
- [x] T033 [US3] Add delete button implementation to `app/components/TaskItem.tsx` — button with a trash/× label; calls `onDelete(task.id)` on click; no confirmation dialog
- [x] T034 [US3] Update `app/page.tsx` to pass `onDelete` handler to `TaskList`; handler calls `deleteTask()` and filters deleted task from state

**Checkpoint**: User Stories 1, 2, and 3 all independently functional. Full CRUD surface complete.

---

## Phase 6: User Story 4 — Error Feedback (Priority: P3)

**Goal**: Backend failures show a user-facing error message with a retry button within 3 seconds.

**Independent Test**: Stop the backend server; load the app — error message and retry button appear. Restart backend, click retry — tasks load and error clears.

### Implementation for User Story 4

- [x] T035 [US4] Create `app/components/ErrorBanner.tsx` — `"use client"`; accepts `message: string` and `onRetry: () => void` props; renders a styled error message div with a "Retry" button that calls `onRetry`
- [x] T036 [US4] Update `app/page.tsx` to catch errors from `getAllTasks()` in the `useEffect` and store in `error` state; render `ErrorBanner` with the error message and a retry callback that resets `isLoading` and re-invokes `getAllTasks()`; clear error state on successful retry
- [x] T037 [US4] Update `app/components/TaskForm.tsx` to catch errors from `createTask()` and render `ErrorBanner` below the form with a retry callback that re-submits the same title
- [x] T038 [US4] Update `app/components/TaskItem.tsx` to catch errors from `toggleTask()` and `deleteTask()` and render an inline `ErrorBanner` for that specific item with a retry callback

**Checkpoint**: All 4 user stories complete and independently testable.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Deployment preparation, validation, and final verification.

- [x] T039 Create `backend/.gitignore` excluding `node_modules/`, `dist/`, `.env`, `*.js.map`
- [x] T040 [P] Verify `app/.gitignore` (or repo root `.gitignore`) excludes `.env.local`
- [x] T041 [P] Run `cd backend && npm run build` — must complete with zero TypeScript errors
- [x] T042 [P] Run `npm run build` in repo root — must complete with zero TypeScript errors
- [x] T043 Run full quickstart.md smoke test: all 10 manual steps pass (add, view, refresh, complete, undo, delete, persist, retry)
- [x] T044 [P] Confirm `localStorage` is NOT used: open DevTools → Application → Local Storage — no task-related keys present after adding tasks
- [x] T045 [P] Confirm CORS: open browser DevTools Network tab while using the deployed app; verify `Access-Control-Allow-Origin` header matches `FRONTEND_URL` on all API responses

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Requires Phase 1 complete — **BLOCKS all user stories**
- **US1 (Phase 3)**: Requires Phase 2 complete — P1 MVP, implement first
- **US2 (Phase 4)**: Requires Phase 2 complete — can start after Foundational (not after US1)
- **US3 (Phase 5)**: Requires Phase 2 complete — can start after Foundational (not after US2)
- **US4 (Phase 6)**: Requires Phase 3 complete — error handling wraps existing operations
- **Polish (Phase 7)**: Requires all user stories complete

### User Story Dependencies

- **US1 (P1)**: Depends on Foundational only — no other story dependency
- **US2 (P2)**: Depends on Foundational only — service and controller extend independently
- **US3 (P2)**: Depends on Foundational only — service and controller extend independently
- **US4 (P3)**: Depends on US1 completing `page.tsx` — wraps existing fetch/create calls with error states

### Within Each User Story

- Backend service method → backend controller endpoint → frontend api.ts function → frontend component → page integration
- Each layer depends on the layer below it

### Parallel Opportunities

- T002, T003, T004, T005, T006, T007 — all Phase 1 tasks after T001
- T011, T012, T013 — Foundational tasks after T010
- T019, T020 — `lib/api.ts` functions (different functions, same file; write sequentially)
- T024 and T026 — backend service and frontend api.ts function for US2
- T030 and T032 — backend service and frontend api.ts function for US3
- T041, T042, T044, T045 — final validation tasks

---

## Parallel Example: Foundational Phase (Phase 2)

```bash
# Run in parallel once T008 + T009 are done:
Task: "Create prisma.service.ts"                    # T010
Task: "Create create-task.dto.ts"                   # T012
Task: "Create update-task.dto.ts"                   # T013

# Then, once T010 is done:
Task: "Create prisma.module.ts"                     # T011
Task: "Create tasks.module.ts"                      # T014
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T007)
2. Complete Phase 2: Foundational (T008–T016) — **CRITICAL, blocks all stories**
3. Complete Phase 3: User Story 1 (T017–T023)
4. **STOP and VALIDATE**: Add tasks, refresh browser, confirm PostgreSQL persistence
5. Demo the MVP before continuing to US2

### Incremental Delivery

1. Setup + Foundational → Backend skeleton running
2. US1 → Create + Read tasks → **MVP demo**
3. US2 → Toggle completion → Extended demo
4. US3 → Delete tasks → Full CRUD demo
5. US4 → Error handling → Production-ready
6. Polish → Deploy

### Parallel Team Strategy

With two developers after Phase 2 completes:

- Developer A: US1 (T017–T023) — full add/view stack
- Developer B: US2 + US3 service/controller (T024–T025, T030–T031) — backend CRUD

---

## Notes

- `[P]` tasks = different files or independent operations; no cross-task dependency
- `[Story]` label maps each task to its user story for traceability
- Each user story phase ends with a named **Checkpoint** — validate before advancing
- Avoid committing with TypeScript errors; run `npm run build` after each phase
- `backend/.env` is gitignored — never commit real credentials
- After Phase 2, `prisma.service.ts` is the single source of all DB access; no raw `pg` queries
