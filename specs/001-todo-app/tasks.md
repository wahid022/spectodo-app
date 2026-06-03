---
description: "Task list for Todo App — Tailwind CSS custom styling, WCAG 2.1 AA"
---

# Tasks: Todo App

**Input**: Design documents from `specs/001-todo-app/` | **Constitution**: v3.0.0

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/components.md ✅

**Tests**: Not requested in spec — no test tasks included.

## Phase 1: Setup

**Purpose**: Align existing files with constitution v3.0.0 requirements.

- [x] T001 Strip `app/globals.css` to the three Tailwind directives only (remove create-next-app boilerplate CSS variables and body rule)

---

## Phase 2: Foundational Infrastructure

**Purpose**: Shared storage module all components depend on.

⚠️ **CRITICAL**: No user story work can begin until this phase is complete.

- [x] T002 Create `lib/storage.ts` — `Todo` type, `STORAGE_KEY` constant, `loadTodos()`, `saveTodos()`

**Checkpoint**: Storage module ready — components can now read/write todos.

---

## Phase 3: User Story 1 — Add and View Tasks (P1) 🎯 MVP

**Goal**: User can add tasks and see them newest-first; empty state when no tasks.

**Independent Test**: Open app, confirm empty state; add three tasks, confirm newest-first.

### Implementation for User Story 1

- [x] T003 [P] Create `app/components/TodoInput.tsx` (`"use client"`) — `<form>` wrapping labeled `<input type="text">` + `<button type="submit">Add</button>`; controlled value state; calls `onAdd(value.trim())` on submit; clears field; rejects empty
- [x] T004 [P] Create `app/components/TodoList.tsx` (`"use client"`) — empty-state `<p>` when `todos.length === 0`; otherwise `<ul role="list">` with one `<li>` per todo (renders `TodoItem`)
- [x] T005 Replace `app/page.tsx` with todo page (`"use client"`) — `useState<Todo[]>([])`, mount `useEffect` to `setTodos(loadTodos())`, `handleAdd` (prepend), renders `TodoInput` + `TodoList`

**Checkpoint**: Add tasks, see newest-first; empty state appears when list is empty.

---

## Phase 4: User Story 4 — Persist Across Reloads (P1)

**Goal**: Tasks and completion states survive page reloads.

**Independent Test**: Add tasks, reload — all tasks restored with correct state.

### Implementation for User Story 4

- [x] T006 Add persistence `useEffect` to `app/page.tsx` — `useEffect(() => saveTodos(todos), [todos])`

**Checkpoint**: Add tasks, reload; tasks are still there.

---

## Phase 5: User Story 2 — Mark Done and Undo (P2)

**Goal**: Toggle task completion with Tailwind strikethrough; completed tasks remain.

**Independent Test**: Add task, toggle done (line-through), toggle again (line-through gone).

### Implementation for User Story 2

- [x] T007 [P] Create `app/components/TodoItem.tsx` (`"use client"`) — toggle `<button>` with dynamic `aria-label`; task `<span>` with `line-through` Tailwind class when `completed`; delete `<button>` with `aria-label`
- [x] T008 [P] Add `handleToggle(id: string)` to `app/page.tsx` — maps todos, flips `completed` on matching id
- [x] T009 Wire `TodoList.tsx` to import and render `TodoItem`; pass `onToggle` + `onDelete` props

**Checkpoint**: User Stories 1 + 2 independently functional.

---

## Phase 6: User Story 3 — Delete a Task (P3)

**Goal**: Permanently remove any task.

**Independent Test**: Add two tasks, delete one; one remains. Delete last; empty state reappears.

### Implementation for User Story 3

- [x] T010 Add `handleDelete(id: string)` to `app/page.tsx` — filters todos to remove matching id

**Checkpoint**: All four user stories independently functional.

---

## Phase 7: Polish & Compliance

**Purpose**: WCAG verification, build, cleanup.

- [x] T011 [P] Remove unused Next.js boilerplate from `app/page.tsx` (Image import, default scaffold JSX)
- [x] T012 Run `npm run build` — zero TypeScript errors; confirms constitution Gate 1

---

## Dependencies & Execution Order

- **Phase 1** (T001): No dependencies — start immediately
- **Phase 2** (T002): Depends on Phase 1
- **Phase 3** (T003–T005): T003 and T004 [P], then T005 depends on both
- **Phase 4** (T006): Depends on T005
- **Phase 5** (T007–T009): T007 and T008 [P], then T009 depends on both
- **Phase 6** (T010): Depends on Phase 5
- **Phase 7** (T011–T012): Depends on all prior phases

## Notes

- `[P]` = different files, no shared state — safe to write in the same pass
- All components MUST declare `"use client"` as their very first line
- All styling via Tailwind utility classes only — no CSS files, no inline styles
- Toggle button accessible label must change dynamically with `todo.completed`
