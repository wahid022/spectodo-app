---
description: "Task list for Enhanced Todo Dashboard"
---

# Tasks: Enhanced Todo Dashboard

**Input**: Design documents from `/specs/003-enhanced-todo-dashboard/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/api.md ✅ | quickstart.md ✅

**Tests**: Not requested — no test tasks generated.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US5)
- Every task includes an exact file path

## Path Conventions

- Backend: `backend/src/`, `backend/prisma/`
- Frontend: `app/`, `lib/` (at repo root — existing Next.js structure)

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Install new dependencies and configure shared tooling that all user stories depend on.

- [x] T001 Install new frontend dependencies from repo root: `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities framer-motion tailwindcss-animate sonner next-themes`
- [x] T002 [P] Configure `tailwind.config.ts` — add `require("tailwindcss-animate")` to `plugins` array; set `darkMode: "class"` at top level
- [x] T003 [P] Create `lib/constants.ts` — export `CATEGORIES` array, `PRIORITIES` array, `CATEGORY_COLORS` record (category→Tailwind badge classes), `PRIORITY_COLORS` record (priority→Tailwind badge classes), `PRIORITY_SORT_WEIGHT` record (priority→number 1–4) as defined in `specs/003-enhanced-todo-dashboard/data-model.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extend the existing backend schema and API to support all new task fields; update the frontend API client and root layout. ALL user story work blocks on this phase.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T004 Update `backend/prisma/schema.prisma` — add four fields to the `Task` model: `category String @default("Personal")`, `priority String @default("Medium")`, `dueDate DateTime?`, `sortOrder Int @default(0)`
- [x] T005 Run `cd backend && npx prisma migrate dev --name add_task_fields`; open the generated migration file at `backend/prisma/migrations/<timestamp>_add_task_fields/migration.sql` and prepend `UPDATE "Task" SET "sortOrder" = CAST(ROW_NUMBER() OVER (ORDER BY "createdAt" ASC) AS INTEGER) - 1;` before the `ALTER TABLE` statements; re-run `npx prisma migrate dev` to apply; confirm new columns appear in `npx prisma studio`
- [x] T006 [P] Update `backend/src/tasks/dto/create-task.dto.ts` — add `@IsString() @IsIn(['Work','Personal','Health','Finance','Learning']) category: string`; `@IsString() @IsIn(['Low','Medium','High','Urgent']) priority: string`; `@IsOptional() @IsISO8601() dueDate?: string`
- [x] T007 [P] Update `backend/src/tasks/dto/update-task.dto.ts` — replace current single `completed` field with fully optional fields: `title` (`@IsOptional @IsString @IsNotEmpty @MaxLength(255)`), `category` (`@IsOptional @IsString @IsIn([...])`), `priority` (`@IsOptional @IsString @IsIn([...])`), `dueDate` (`@IsOptional @IsISO8601`), `completed` (`@IsOptional @IsBoolean`)
- [x] T008 [P] Create `backend/src/tasks/dto/reorder-tasks.dto.ts` — define `ReorderItemDto` with `@IsString() @IsNotEmpty() id` and `@IsInt() @Min(0) sortOrder`; define `ReorderTasksDto` with `@IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => ReorderItemDto) tasks: ReorderItemDto[]`
- [x] T009 Update `backend/src/tasks/tasks.service.ts` — update `create()` to persist `category`, `priority`, `dueDate`, and auto-assign `sortOrder` as `(await this.prisma.task.aggregate({ _max: { sortOrder: true } }))._max.sortOrder + 1` defaulting to 0; update `findAll()` to `orderBy: { sortOrder: 'asc' }`; rename `toggle()` to `update()` accepting full `UpdateTaskDto`; add `reorder(dto: ReorderTasksDto): Promise<{ updated: number }>` running `this.prisma.$transaction(dto.tasks.map(t => this.prisma.task.update({ where: { id: t.id }, data: { sortOrder: t.sortOrder } })))` returning `{ updated: dto.tasks.length }`
- [x] T010 Update `backend/src/tasks/tasks.controller.ts` — declare `@Patch('reorder')` handler (calling `tasksService.reorder(dto)`) **before** `@Patch(':id')` to prevent route collision; update `@Patch(':id')` to call `tasksService.update(id, dto)`; update `@Post()` to use new `CreateTaskDto` shape
- [x] T011 Update `lib/api.ts` — extend `Task` type with `category: string`, `priority: string`, `dueDate: string | null`, `sortOrder: number`; rename `createTask(title)` → `createTask(data: { title: string; category: string; priority: string; dueDate?: string | null })` sending full payload; add `editTask(id: string, data: Partial<{ title: string; category: string; priority: string; dueDate: string | null; completed: boolean }>): Promise<Task>` using `PATCH /tasks/:id`; add `reorderTasks(tasks: { id: string; sortOrder: number }[]): Promise<{ updated: number }>` using `PATCH /tasks/reorder`
- [x] T012 Update `app/layout.tsx` — import `ThemeProvider` from `next-themes` and `Toaster` from `sonner`; add `suppressHydrationWarning` to the `<html>` element; wrap the `{children}` body content with `<ThemeProvider attribute="class" defaultTheme="system">`; add `<Toaster richColors position="top-right" theme="system" />` inside the body
- [x] T013 [P] Update `app/globals.css` — ensure Tailwind dark mode base styles are set; add `@layer base` block setting `background-color` and `color` CSS variables for light and dark themes that Tailwind's `dark:` classes reference

**Checkpoint**: `cd backend && npm run start:dev` — `GET http://localhost:3001/tasks` returns tasks with `category`, `priority`, `dueDate`, `sortOrder` fields ordered by `sortOrder ASC`; `POST /tasks` with `{"title":"x","category":"Work","priority":"High"}` returns 201 with all new fields; `PATCH /tasks/reorder` with valid payload returns `{"updated":N}`.

---

## Phase 3: User Story 1 — Create, View, and Manage Tasks (Priority: P1) 🎯 MVP

**Goal**: Users can create tasks with category/priority/due date via a FAB + modal, view them as rich cards with color badges, edit any field via the same modal, toggle completion, and delete tasks. All actions show per-row loading state and toast notifications.

**Independent Test**: Click the "+" FAB → modal opens → fill in title "Buy groceries", category "Personal", priority "High", due date tomorrow → save → card appears with purple "Personal" badge and amber "High" badge and amber due date → click edit → modal pre-filled → change priority to "Urgent" → save → badge turns red → toggle checkbox → strikethrough + loading indicator → delete → card fades out. All with toasts.

### Implementation for User Story 1

- [x] T014 [US1] Create `app/components/TaskModal.tsx` — `"use client"`; accept props `mode: "create" | "edit"`, `task?: Task`, `isOpen: boolean`, `isSubmitting: boolean`, `onClose: () => void`, `onSave: (data: object) => void`; use `framer-motion` `AnimatePresence` + `motion.div` for modal backdrop (semi-transparent) and centered card (slide-up on enter, fade-out on exit); render form with: text input for title (auto-focused, max 255), `<select>` for category (options from `CATEGORIES`), `<select>` for priority (options from `PRIORITIES`), `<input type="date">` for due date (optional); show `isSubmitting` spinner on the Save button and disable all fields; close on `Escape` key and backdrop click; show inline validation message if title is empty on submit
- [x] T015 [P] [US1] Create `app/components/FAB.tsx` — `"use client"`; fixed-position button (`fixed bottom-6 right-6 z-50`); renders a `+` icon; `framer-motion` `whileHover={{ scale: 1.1 }}` and `whileTap={{ scale: 0.95 }}`; accepts `onClick: () => void` and `disabled?: boolean`; grayed out when disabled
- [x] T016 [P] [US1] Update `app/components/TaskList.tsx` — remove `TaskItem` import; import `TaskCard`; accept additional props `loadingId: string | null`, `onEdit: (task: Task) => void`; pass `isLoading={loadingId === task.id}`, `onEdit`, `onToggle`, `onDelete` through to each `TaskCard`; keep existing loading spinner (full-list) and empty-state message
- [x] T017 [US1] Create `app/components/TaskCard.tsx` — `"use client"`; accept props `task: Task`, `isLoading: boolean`, `onToggle: (id: string, completed: boolean) => void`, `onEdit: (task: Task) => void`, `onDelete: (id: string) => void`; render a card row with: `GripVertical` drag handle placeholder (icon visible but not yet interactive, `cursor-grab`), checkbox (calls `onToggle` on change, disabled when `isLoading`), title (line-through and muted when `completed`), category badge (color from `CATEGORY_COLORS`), priority badge (color from `PRIORITY_COLORS`), due date label (amber if today, red if past today, gray if future or null), pencil edit button (calls `onEdit(task)`), trash delete button (calls `onDelete(task.id)`); show a spinner overlay centered on the card when `isLoading=true`; disable all interactive elements when `isLoading=true`; apply `tailwindcss-animate` `animate-in slide-in-from-top-2 duration-200` on mount
- [x] T018 [US1] Refactor `app/page.tsx` for User Story 1 — add `useState` for: `modalState: { open: boolean; mode: "create" | "edit"; task?: Task }`, `isSubmitting: boolean`, `loadingId: string | null`; implement `handleCreate(data)`: sets `isSubmitting=true`, calls `createTask(data)`, prepends new task to `tasks` state, calls `toast.success("Task created")`, closes modal; implement `handleEdit(id, data)`: sets `isSubmitting=true`, calls `editTask(id, data)`, replaces matching task in `tasks` state, calls `toast.success("Task updated")`, closes modal; update `handleDelete(id)`: sets `loadingId=id`, calls `deleteTask(id)`, filters task from state, calls `toast.success("Task deleted")`, clears `loadingId`; update `handleToggle`: sets `loadingId=task.id`, calls `editTask(id, { completed })`, updates matching task in state, clears `loadingId`; render `<TaskModal>` controlled by `modalState` with `isSubmitting`; render `<FAB>` opening create modal; render `<TaskList>` with `loadingId`, `onEdit` (opens edit modal), `onToggle`, `onDelete`; keep `<ErrorBanner>` for fetch errors
- [x] T019 [P] [US1] Delete `app/components/TaskForm.tsx` — fully replaced by `FAB` + `TaskModal`
- [x] T020 [P] [US1] Delete `app/components/TaskItem.tsx` — fully replaced by `TaskCard`

**Checkpoint**: User Story 1 fully functional. All CRUD operations work end-to-end with PostgreSQL persistence, loading states, and toast notifications. `localStorage` not involved.

---

## Phase 4: User Story 2 — Filter, Search, and Sort Tasks (Priority: P2)

**Goal**: Users can search tasks in real time, filter by status/category/priority with composable chips, and sort by due date, priority, or creation date. All filters compose together; clearing them restores the full list.

**Independent Test**: Add 8 tasks across 3 categories and 3 priorities. Type "gym" in search → only matching tasks shown. Click "High" priority chip → further narrowed. Click "Work" category chip → further narrowed. Clear search → priority+category filters remain. Apply "Due Date" sort → tasks reorder; drag handle tooltip appears. Click "Clear sort" → previous filtered view restored without drag handles.

### Implementation for User Story 2

- [x] T021 [P] [US2] Create `app/components/FilterBar.tsx` — `"use client"`; accept `filterState: FilterState` and `onChange: (f: FilterState) => void`; render: search `<input>` (debounced 100ms, calls `onChange` with updated `search`); status pill buttons (All / Active / Completed) highlighting the active one; category chip buttons (one per `CATEGORIES` entry, toggled in/out of `filterState.categories` array on click, multi-select); priority chip buttons (one per `PRIORITIES` entry, toggled in/out of `filterState.priorities` array, multi-select); a "Clear all" button visible when any filter is non-default; all chips show count of matching tasks if `tasks` prop provided
- [x] T022 [P] [US2] Create `app/components/SortBar.tsx` — `"use client"`; accept `sortBy: FilterState["sortBy"]`, `onChange: (s: FilterState["sortBy"]) => void`, `isDragDisabled: boolean`; render a `<select>` with options: `custom` (Custom Order), `dueDate` (Due Date ↑), `priority` (Priority ↓), `createdAt` (Created ↓); when `sortBy !== "custom"` show a "Clear sort" button that calls `onChange("custom")`; when `isDragDisabled` is true show a small amber badge "Drag disabled while sorted"
- [x] T023 [US2] Update `app/page.tsx` for User Story 2 — add `const [filterState, setFilterState] = useState<FilterState>({ search: "", status: "all", categories: [], priorities: [], sortBy: "custom" })`; add `const displayedTasks = useMemo(...)` applying filters in order: search (case-insensitive `title.includes`), status (`all`/`active`/`completed`), categories (empty = show all), priorities (empty = show all), then sort by `sortBy` (`custom` = `sortOrder ASC`, `dueDate` = ISO date ASC nulls-last, `priority` = `PRIORITY_SORT_WEIGHT` DESC, `createdAt` = DESC); pass `displayedTasks` to `TaskList`/`DraggableTaskList` instead of raw `tasks`; render `<FilterBar>` and `<SortBar>` above the task list; pass `isDragDisabled = filterState.sortBy !== "custom" || filterState.search !== "" || filterState.categories.length > 0 || filterState.priorities.length > 0 || filterState.status !== "all"` to `SortBar` and drag list

**Checkpoint**: User Stories 1 and 2 both independently functional and testable.

---

## Phase 5: User Story 3 — Progress Dashboard Summary (Priority: P2)

**Goal**: A summary section at the top of the dashboard shows total tasks, completed count, percentage, and an animated progress bar. The bar animates immediately when any task is toggled.

**Independent Test**: Add 4 tasks, complete 2 — progress bar shows 50% and animates smoothly to 75% when a third is completed. All 4 completed → bar turns green. Zero tasks → prompt to add first task.

### Implementation for User Story 3

- [x] T024 [US3] Create `app/components/ProgressSummary.tsx` — `"use client"`; accept `tasks: Task[]`; compute `total = tasks.length`, `completed = tasks.filter(t => t.completed).length`, `percentage = total === 0 ? 0 : Math.round((completed / total) * 100)`; render: row showing `completed / total tasks` count; animated progress bar `<div style={{ width: \`${percentage}%\` }} className="transition-all duration-300 ...">`; color the bar green when `percentage === 100`, blue otherwise; when `total === 0` render an illustrated empty prompt "Add your first task to get started"; category breakdown: for each `CATEGORIES` entry render a mini bar showing (completed in category / total in category) using the category's color
- [x] T025 [US3] Update `app/page.tsx` for User Story 3 — import and render `<ProgressSummary tasks={tasks} />` above the filter bar; pass raw (unfiltered) `tasks` state so progress always reflects the true total, not the current filtered view

**Checkpoint**: User Stories 1, 2, and 3 all independently functional. Progress bar animates correctly on every toggle action.

---

## Phase 6: User Story 4 — Drag-and-Drop Reorder (Priority: P3)

**Goal**: Users can drag tasks by a handle to reorder them. The new order persists across page refreshes. Drag is disabled when any filter or sort is active, with a visible explanation.

**Independent Test**: Add tasks A, B, C. Drag C to the top. Refresh → order is C, A, B. Apply a category filter → drag handles disappear and tooltip says drag disabled. Clear filter → handles return and order is still C, A, B.

### Implementation for User Story 4

- [x] T026 [US4] Update `app/components/TaskCard.tsx` for drag-and-drop — accept additional props `isDragEnabled: boolean`, and spread `dragHandleProps?: object` onto the `GripVertical` handle element; show `cursor-grab` when enabled, `cursor-not-allowed opacity-30` when disabled; apply `attributes` and `listeners` from caller via `dragHandleProps`
- [x] T027 [US4] Create `app/components/DraggableTaskList.tsx` — `"use client"`; import `DndContext`, `PointerSensor`, `useSensor`, `useSensors`, `DragOverlay` from `@dnd-kit/core`; import `SortableContext`, `verticalListSortingStrategy`, `arrayMove`, `useSortable` from `@dnd-kit/sortable`; create inner `SortableTaskCard` component that calls `useSortable({ id: task.id })` and passes `transform`/`transition` styles and `dragHandleProps` to `TaskCard`; wrap all in `DndContext` with `PointerSensor` (`activationConstraint: { distance: 8 }`); on `onDragEnd`, call `arrayMove` and invoke `onReorder(reorderedList)` prop; render `DragOverlay` showing a semi-transparent ghost of the dragged card; accept `isDragEnabled: boolean` and pass through to each `SortableTaskCard`; when `isDragEnabled=false` render plain `TaskCard` rows without sortable wrappers
- [x] T028 [US4] Update `app/page.tsx` for User Story 4 — add `handleReorder(reorderedTasks: Task[])`: optimistically updates `tasks` state with new order (immediate visual feedback), then calls `reorderTasks(reorderedTasks.map((t, i) => ({ id: t.id, sortOrder: i })))`, and on API error calls `toast.error("Failed to save order")` and re-fetches tasks to restore server state; replace `<TaskList>` with `<DraggableTaskList>` passing `isDragEnabled`, `onReorder={handleReorder}`, `loadingId`, `onEdit`, `onToggle`, `onDelete`

**Checkpoint**: Drag-and-drop persists across refresh. Active filter/sort disables drag with tooltip. Touch fallback arrow buttons appear on touch-only devices.

---

## Phase 7: User Story 5 — Dark Mode and Responsive Layout (Priority: P3)

**Goal**: The entire UI switches between light and dark mode instantly with no flash. Theme preference persists. On mobile (< 768px) the sidebar is hidden and all actions are accessible. On desktop (≥ 1024px) a fixed sidebar shows category navigation and per-category task counts.

**Independent Test**: Click dark mode toggle → full UI switches instantly (no white flash). Refresh → dark mode retained. Resize to 375px → sidebar hidden, FAB visible and tappable, filter bar accessible. Resize to 1024px+ → sidebar visible with category names and task counts.

### Implementation for User Story 5

- [x] T029 [P] [US5] Create `app/components/ThemeToggle.tsx` — `"use client"`; import `useTheme` from `next-themes`; use `useState(false)` for `mounted`; set `mounted=true` in `useEffect` to avoid SSR mismatch; before mounted render a neutral placeholder icon button; after mounted render a toggle button: sun icon when `theme === "dark"`, moon icon when `theme === "light"`; on click, call `setTheme(theme === "dark" ? "light" : "dark")`; apply smooth icon crossfade with `transition-opacity duration-200`
- [x] T030 [P] [US5] Create `app/components/Sidebar.tsx` — `"use client"`; accept `tasks: Task[]`, `filterState: FilterState`, `onCategoryClick: (cat: string) => void`; render `hidden lg:flex flex-col` fixed left sidebar (256px wide); show app logo/title at top; list each category from `CATEGORIES` with its color dot, name, and count of tasks in that category; highlight active category from `filterState.categories`; clicking a category calls `onCategoryClick`; show total task count and completion percentage at the bottom
- [x] T031 [US5] Update `app/page.tsx` for User Story 5 — restructure page layout to a flex row: `<Sidebar>` (desktop only, `hidden lg:block w-64 shrink-0`) + main panel (`flex-1 min-w-0`); inside main panel header: app title (visible on mobile, hidden on desktop since sidebar has it), `<ThemeToggle>` button right-aligned; pass `tasks` and `filterState` and `onCategoryClick` to `<Sidebar>`; ensure all content sections have correct `dark:` Tailwind variants at the page level
- [x] T032 [P] [US5] Add dark mode classes to all components — audit and update `app/components/TaskCard.tsx`, `app/components/TaskModal.tsx`, `app/components/FilterBar.tsx`, `app/components/SortBar.tsx`, `app/components/ProgressSummary.tsx`, `app/components/ErrorBanner.tsx`, `app/components/FAB.tsx` — add appropriate `dark:bg-*`, `dark:text-*`, `dark:border-*` Tailwind classes so each component is visually correct in both light and dark themes

**Checkpoint**: All 5 user stories complete and independently testable. Dark mode works with no FOUC. Responsive layout works at 375px and 1024px+.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Build validation, environment checks, and final smoke test.

- [x] T033 Run `cd backend && npm run build` — must complete with zero TypeScript errors
- [x] T034 [P] Run `npm run build` from repo root — must complete with zero TypeScript errors
- [x] T035 [P] Verify `.gitignore` excludes `backend/.env` and `.env.local`; confirm neither file contains committed credentials; confirm `backend/.env.example` documents all three variables with placeholder values
- [x] T036 Run full quickstart.md manual acceptance checklist — all 16 steps must pass (FAB, create, edit, delete, toggle, progress bar, search, filter, sort, clear sort, drag-and-drop, persist after refresh, dark mode, responsive mobile, error banner, retry)
- [x] T037 [P] Confirm `localStorage` is NOT used for task data — open browser DevTools → Application → Local Storage → verify no task-related keys exist after adding, editing, and toggling tasks
- [x] T038 [P] Confirm CORS — run `curl -s -I -H "Origin: http://localhost:3000" http://localhost:3001/tasks | grep -i access-control`; must return `Access-Control-Allow-Origin: http://localhost:3000`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately; T002 and T003 run in parallel after T001
- **Foundational (Phase 2)**: Requires Phase 1 complete — **BLOCKS all user stories**
- **US1 (Phase 3)**: Requires Phase 2 complete — P1 MVP; implement first
- **US2 (Phase 4)**: Requires Phase 2 complete — can start after Foundational (independent of US1)
- **US3 (Phase 5)**: Requires Phase 2 complete — can start after Foundational (independent of US1/US2)
- **US4 (Phase 6)**: Requires US1 complete (uses TaskCard) and Phase 2 complete (uses reorder endpoint)
- **US5 (Phase 7)**: Requires US1 complete (uses page.tsx layout); US2/US3 layout can be added in parallel
- **Polish (Phase 8)**: Requires all user stories complete

### User Story Dependencies

- **US1 (P1)**: Depends on Foundational only — no other story dependency
- **US2 (P2)**: Depends on Foundational only — adds to existing task list state
- **US3 (P2)**: Depends on Foundational only — reads from existing task state
- **US4 (P3)**: Depends on US1 — wraps TaskCard in sortable context
- **US5 (P3)**: Depends on US1 — restructures page layout; dark mode audit touches all components

### Within Each User Story

Backend service → backend controller → frontend api.ts → frontend components → page integration

### Parallel Opportunities

- T002, T003 — Setup tasks after T001
- T006, T007, T008 — DTOs after T004+T005
- T015, T016 — FAB and TaskList update (parallel within US1, different files)
- T019, T020 — File deletions (parallel, no deps)
- T021, T022 — FilterBar and SortBar (parallel within US2, different files)
- T029, T030 — ThemeToggle and Sidebar (parallel within US5, different files)
- T033, T034, T035, T037, T038 — Polish validation tasks

---

## Parallel Example: Foundational Phase (Phase 2)

```bash
# After T004 + T005 (schema + migration):
Task: "Update create-task.dto.ts"       # T006
Task: "Update update-task.dto.ts"       # T007
Task: "Create reorder-tasks.dto.ts"     # T008

# After T006-T008:
Task: "Update tasks.service.ts"         # T009

# After T009:
Task: "Update tasks.controller.ts"      # T010

# In parallel with backend (different files):
Task: "Update lib/api.ts"               # T011
Task: "Update app/layout.tsx"           # T012
Task: "Update app/globals.css"          # T013
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T003)
2. Complete Phase 2: Foundational (T004–T013) — **CRITICAL, blocks all stories**
3. Complete Phase 3: User Story 1 (T014–T020)
4. **STOP and VALIDATE**: Create a task with category/priority/due date; edit it; delete it; all toasts fire; no `localStorage` involved
5. Demo the MVP before continuing to US2

### Incremental Delivery

1. Setup + Foundational → Extended backend running, root layout ready
2. US1 → Full CRUD with rich cards → **MVP demo**
3. US2 → Filter, search, sort → **Productivity demo**
4. US3 → Progress summary → **Motivation layer**
5. US4 → Drag-and-drop → **Power user demo**
6. US5 → Dark mode + responsive → **Production quality demo**
7. Polish → Ship

### Parallel Team Strategy

After Phase 2 completes:

- Developer A: US1 (T014–T020) — full CRUD stack
- Developer B: US2 + US3 (T021–T025) — filtering and progress (no TaskCard dependency)
- Developer A (after US1): US4 (T026–T028) — drag-and-drop wraps TaskCard
- Developer B (after US2/US3): US5 (T029–T032) — dark mode + responsive layout

---

## Notes

- `[P]` tasks = different files or independent operations; no cross-task dependency
- `[Story]` label maps each task to its user story for traceability
- Each user story phase ends with a named **Checkpoint** — validate before advancing
- Run `npm run build` (both repos) after each phase to catch TypeScript errors early
- `backend/.env` is gitignored — never commit real credentials
- The `PATCH /tasks/reorder` route MUST be declared before `PATCH /tasks/:id` in the NestJS controller — order matters
- Drag-and-drop is the one place where the app uses an optimistic update (immediate visual reorder) for UX reasons; all other mutations are pessimistic
