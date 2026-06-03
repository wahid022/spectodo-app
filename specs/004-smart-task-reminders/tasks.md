---
description: "Task list for Smart Task Reminder System with Responsive Card UI"
---

# Tasks: Smart Task Reminder System with Responsive Card UI

**Input**: Design documents from `specs/004-smart-task-reminders/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/api.md ✅ | quickstart.md ✅

**Tests**: Not requested — no test tasks generated.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)
- Every task includes an exact file path

## Path Conventions

- Backend: `backend/src/`, `backend/prisma/`
- Frontend: `app/`, `lib/`, `public/` (at repo root — existing Next.js structure)

---

## Phase 1: Setup

**Purpose**: Source the one external asset required by all reminder stories.

- [x] T001 Download a royalty-free short alarm sound (≤10s, MP3 format — e.g., from freesound.org or use `ffmpeg -f lavfi -i "sine=frequency=880:duration=3" public/sounds/reminder.mp3` to generate a simple beep) and place it at `public/sounds/reminder.mp3`; create the `public/sounds/` directory if it does not exist

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extend the backend schema and API layer to support all 5 new reminder fields. ALL user story work blocks on this phase.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T002 Update `backend/prisma/schema.prisma` — add 5 new fields to the Task model after `sortOrder`: `reminderTime DateTime?`, `reminderEnabled Boolean @default(false)`, `reminderStatus String @default("none")`, `notificationTriggered Boolean @default(false)`, `snoozeUntil DateTime?`

- [x] T003 Run `cd backend && npx prisma migrate dev --name add_reminder_fields`; verify the generated SQL at `backend/prisma/migrations/<timestamp>_add_reminder_fields/migration.sql` contains `ALTER TABLE "Task" ADD COLUMN "reminderTime" TIMESTAMP(3), ADD COLUMN "reminderEnabled" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN "reminderStatus" TEXT NOT NULL DEFAULT 'none', ADD COLUMN "notificationTriggered" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN "snoozeUntil" TIMESTAMP(3);`; then run `cd backend && npx prisma generate` to regenerate the Prisma client

- [x] T004 [P] Update `backend/src/tasks/dto/create-task.dto.ts` — add two optional fields: `@IsOptional() @IsISO8601() reminderTime?: string;` and `@IsOptional() @IsBoolean() reminderEnabled?: boolean;`; import `IsISO8601` and `IsBoolean` from `class-validator`

- [x] T005 [P] Update `backend/src/tasks/dto/update-task.dto.ts` — add four optional fields: `@IsOptional() @IsISO8601() reminderTime?: string | null;`, `@IsOptional() @IsBoolean() reminderEnabled?: boolean;`, `@IsOptional() @IsString() @IsIn(['none','pending','snoozed','dismissed']) reminderStatus?: string;`, `@IsOptional() @IsBoolean() notificationTriggered?: boolean;`; note `snoozeUntil` is NOT accepted from client — computed server-side only

- [x] T006 Update `backend/src/tasks/tasks.service.ts` `update()` method — before the `this.prisma.task.update()` call, add reminder side-effect logic: (1) if `dto.reminderStatus === 'snoozed'`, add `snoozeUntil: new Date(Date.now() + 5 * 60 * 1000)` and `notificationTriggered: false` to the data object; (2) if `dto.reminderStatus === 'dismissed'`, add `snoozeUntil: null` to data; (3) if `dto.completed === true`, add `reminderEnabled: false, reminderStatus: 'none', snoozeUntil: null` to data; (4) if `dto.reminderEnabled === false`, add `reminderStatus: 'none', notificationTriggered: false, snoozeUntil: null` to data; (5) in the `create()` method, if `dto.reminderEnabled === true` and `dto.reminderTime` is set, add `reminderStatus: 'pending'` to the create data; update the `create()` data spread to include `reminderTime`, `reminderEnabled` from dto

- [x] T007 [P] Update `lib/api.ts` — extend the `Task` type with 5 new fields: `reminderTime: string | null; reminderEnabled: boolean; reminderStatus: 'none' | 'pending' | 'snoozed' | 'dismissed'; notificationTriggered: boolean; snoozeUntil: string | null;`; extend `CreateTaskPayload` with `reminderTime?: string | null; reminderEnabled?: boolean;`; add three convenience functions: `export function markReminderTriggered(id: string): Promise<Task> { return editTask(id, { notificationTriggered: true }); }`, `export function snoozeReminder(id: string): Promise<Task> { return editTask(id, { reminderStatus: 'snoozed' }); }`, `export function dismissReminder(id: string): Promise<Task> { return editTask(id, { reminderStatus: 'dismissed', notificationTriggered: true }); }`; update `EditTaskPayload` to include all 4 reminder fields as optional

- [x] T008 [P] Update `lib/constants.ts` — add at the bottom: `export type ReminderStatus = 'none' | 'pending' | 'snoozed' | 'dismissed';`, `export const REMINDER_STATUS_LABELS: Record<ReminderStatus, string> = { none: 'No reminder', pending: 'Reminder set', snoozed: 'Snoozed', dismissed: 'Dismissed' };`, `export const REMINDER_STATUS_COLORS: Record<ReminderStatus, string> = { none: 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600', pending: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', snoozed: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400', dismissed: 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600' };`, `export const SNOOZE_DURATION_MS = 5 * 60 * 1000;`, `export const ALARM_AUTO_STOP_MS = 5 * 60 * 1000;`, `export const REMINDER_POLL_INTERVAL_MS = 30 * 1000;`

**Checkpoint**: `GET http://localhost:3001/tasks` returns tasks with `reminderTime`, `reminderEnabled`, `reminderStatus`, `notificationTriggered`, `snoozeUntil` fields. `PATCH /tasks/:id` with `{ "reminderStatus": "snoozed" }` returns task with `snoozeUntil` set to now+5min. `PATCH /tasks/:id` with `{ "completed": true }` returns task with `reminderEnabled: false`.

---

## Phase 3: User Story 1 — Set and Receive Task Reminders (Priority: P1) 🎯 MVP

**Goal**: Users can add a reminder time to a task via the modal. A poller detects when the time arrives and fires a desktop notification (via SW) + alarm sound + in-app banner + visual card pulse.

**Independent Test**: Create a task with a reminder set 1 minute from now. Wait. Verify desktop notification appears with "Snooze 5 min" and "Dismiss" buttons, alarm plays, task card pulses with amber ring. In-app banner appears with same action buttons. (If notification permission is denied, verify only the in-app banner and alarm appear.)

### Implementation for User Story 1

- [x] T009 [US1] Create `public/sw.js` — minimal service worker (≤35 lines); add `self.addEventListener('install', e => e.waitUntil(self.skipWaiting()))`, `self.addEventListener('activate', e => e.waitUntil(clients.claim()))`, and `self.addEventListener('notificationclick', e => { e.notification.close(); const bc = new BroadcastChannel('task-reminders'); bc.postMessage({ action: e.action || 'click', taskId: e.notification.data?.taskId }); bc.close(); })` — the `|| 'click'` handles the case where the user clicks the notification body (not an action button)

- [x] T010 [P] [US1] Create `lib/reminderAudio.ts` — module-level `let audio: HTMLAudioElement | null = null; let autoStopHandle: ReturnType<typeof setTimeout> | null = null;`; export `function initAudio() { if (typeof window !== 'undefined' && !audio) { audio = new Audio('/sounds/reminder.mp3'); audio.loop = true; } }`, `function playAlarm() { if (!audio) return; clearTimeout(autoStopHandle!); audio.currentTime = 0; audio.play().catch(() => {}); autoStopHandle = setTimeout(stopAlarm, 5 * 60 * 1000); }`, `function stopAlarm() { if (!audio) return; audio.pause(); audio.currentTime = 0; clearTimeout(autoStopHandle!); }`, `function unlockAudio() { if (!audio) return; audio.play().then(() => { audio!.pause(); audio!.currentTime = 0; }).catch(() => {}); }`; export all four functions

- [x] T011 [P] [US1] Create `lib/notificationService.ts` — export `async function registerSW(): Promise<void> { if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return; try { await navigator.serviceWorker.register('/sw.js'); } catch {} }`, `async function requestNotificationPermission(): Promise<NotificationPermission> { if (!('Notification' in window)) return 'denied'; if (Notification.permission !== 'default') return Notification.permission; return Notification.requestPermission(); }`, `async function showReminderNotification(taskId: string, title: string): Promise<void> { if (Notification.permission !== 'granted') return; const reg = await navigator.serviceWorker.ready; await reg.showNotification(title, { body: 'Reminder: tap to manage', actions: [{ action: 'snooze', title: 'Snooze 5 min' }, { action: 'dismiss', title: 'Dismiss' }], data: { taskId }, icon: '/favicon.ico' }); }`, `function listenForNotificationActions(onSnooze: (id: string) => void, onDismiss: (id: string) => void): () => void { const bc = new BroadcastChannel('task-reminders'); bc.onmessage = (e) => { const { action, taskId } = e.data; if (action === 'snooze') onSnooze(taskId); else onDismiss(taskId); }; return () => bc.close(); }`; export all functions

- [x] T012 [US1] Create `lib/useReminderChecker.ts` — `"use client"`; `import { useEffect, useRef } from 'react'; import { Task } from './api'; import { REMINDER_POLL_INTERVAL_MS } from './constants';`; export `function useReminderChecker(tasks: Task[], onReminderDue: (task: Task) => void): void`; inside useEffect, create `checkReminders()` function that: gets `const now = new Date()`; filters tasks where `task.reminderEnabled && !task.notificationTriggered && task.reminderStatus !== 'dismissed'` and either (`task.reminderStatus === 'pending' && task.reminderTime && new Date(task.reminderTime) <= now`) or (`task.reminderStatus === 'snoozed' && task.snoozeUntil && new Date(task.snoozeUntil) <= now`); calls `onReminderDue(task)` for each match; set up `const id = setInterval(checkReminders, REMINDER_POLL_INTERVAL_MS)` and `document.addEventListener('visibilitychange', onVisible)` where `onVisible = () => { if (document.visibilityState === 'visible') checkReminders(); }`; run `checkReminders()` immediately on mount; return cleanup `() => { clearInterval(id); document.removeEventListener('visibilitychange', onVisible); }`; wrap tasks in `useRef` to avoid stale closure: `const tasksRef = useRef(tasks); useEffect(() => { tasksRef.current = tasks; }, [tasks]);` and read from `tasksRef.current` inside `checkReminders`

- [x] T013 [US1] Update `app/layout.tsx` — create a small `"use client"` component at the top of the file (before the `RootLayout` export): `function ClientInit() { useEffect(() => { registerSW(); const handler = () => { unlockAudio(); document.removeEventListener('click', handler); }; document.addEventListener('click', handler); return () => document.removeEventListener('click', handler); }, []); return null; }`; import `registerSW` from `'@/lib/notificationService'`, `unlockAudio` and `initAudio` from `'@/lib/reminderAudio'`, and `useEffect` from `'react'`; call `initAudio()` inside the useEffect before registering the click handler; render `<ClientInit />` as the first child inside the `ThemeProvider` in `RootLayout`

- [x] T014 [US1] Update `app/components/TaskModal.tsx` — add `reminderEnabled: boolean` and `reminderTime: string` to `TaskFormData` type; add form state `const [reminderEnabled, setReminderEnabled] = useState(false)` and `const [reminderTime, setReminderTime] = useState('')`; pre-fill in edit mode with `task.reminderEnabled` and `task.reminderTime ? task.reminderTime.slice(0,16) : ''`; add to the form after the Due Date field: a toggle row `<label className="flex items-center gap-2 text-sm ..."><input type="checkbox" checked={reminderEnabled} onChange={e => setReminderEnabled(e.target.checked)} /> Enable reminder</label>`; when `reminderEnabled=true`, show `<input type="datetime-local" value={reminderTime} onChange={...} className={inputCls} />`; add `reminderEnabled` and `reminderTime` to the `onSave(...)` call in `handleSubmit`; validate: if `reminderEnabled && !reminderTime`, set an inline error "Please set a reminder time"

- [x] T015 [US1] Update `app/page.tsx` for User Story 1 — add `const [activeAlerts, setActiveAlerts] = useState<Task[]>([])` state; add `useReminderChecker(tasks, handleReminderDue)` call; implement `async function handleReminderDue(task: Task)`: call `markReminderTriggered(task.id)`, update tasks state with returned task, call `playAlarm()`, call `showReminderNotification(task.id, task.title)`, call `setActiveAlerts(prev => prev.some(a => a.id === task.id) ? prev : [...prev, task])`; update `handleCreate` and `handleEdit` to include `reminderEnabled` and `reminderTime` (if provided) in the payload to `createTask`/`editTask`; import all new functions; render `<ReminderBanner alerts={activeAlerts} onSnooze={handleSnooze} onDismiss={handleDismiss} />` as the first element inside the main content area (before the header); add `isAlerting={activeAlerts.some(a => a.id === task.id)}` prop to each `TaskCard` rendered by passing it through `TaskList` and `DraggableTaskList`

- [x] T016 [US1] Create `app/components/ReminderBanner.tsx` — `"use client"`; import `AnimatePresence, motion` from `'framer-motion'`; import `stopAlarm` from `'@/lib/reminderAudio'`; accept props `alerts: Task[], onSnooze: (id: string) => void, onDismiss: (id: string) => void`; render `<AnimatePresence>` wrapping a `motion.div` (fixed top-4 left-4 right-4 z-50 space-y-2) containing one alert card per entry in `alerts`; each card: amber background `bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 rounded-xl px-4 py-3 shadow-lg flex items-center gap-3`; shows a bell icon, the task title, "Snooze 5 min" button (calls `stopAlarm()` then `onSnooze(alert.id)`), and "Dismiss" button (calls `stopAlarm()` then `onDismiss(alert.id)`); each card uses `motion.div` with `initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-20 }}` with key=`alert.id`

- [x] T017 [US1] Update `app/components/TaskCard.tsx` — add `isAlerting?: boolean` prop to the `Props` type; when `isAlerting=true`, add `animate-pulse ring-2 ring-amber-400 dark:ring-amber-500` classes to the outer `<li>` element (in addition to existing classes); add a reminder info row below the badges row: when `task.reminderEnabled && task.reminderTime`, show a small clock icon + formatted reminder datetime + the `REMINDER_STATUS_LABELS[task.reminderStatus]` badge with `REMINDER_STATUS_COLORS[task.reminderStatus]` classes; format the datetime using `new Date(task.reminderTime).toLocaleString(undefined, { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })`; import `REMINDER_STATUS_LABELS, REMINDER_STATUS_COLORS, ReminderStatus` from `'@/lib/constants'`

**Checkpoint**: User Story 1 fully functional. Setting a reminder 1 minute from now triggers notification + alarm + banner + card pulse. All confirmed with GET /tasks showing correct state.

---

## Phase 4: User Story 2 — Snooze, Dismiss, and Disable Reminders (Priority: P1)

**Goal**: Users can snooze an active reminder (re-triggers in 5 min, persists through refresh), dismiss it permanently, and disable a future reminder via the task edit modal.

**Independent Test**: Trigger a reminder → click "Snooze 5 min" → verify alarm stops, banner clears, card shows "Snoozed" badge, page refresh shows snooze still active → wait 5 min → reminder re-fires. Trigger again → click "Dismiss" → no further re-trigger. Edit task → disable reminder toggle → no notification at original time.

### Implementation for User Story 2

- [x] T018 [US2] Update `app/page.tsx` for User Story 2 — implement `async function handleSnooze(id: string)`: call `snoozeReminder(id)`, update tasks state with returned task, remove id from `activeAlerts`; implement `async function handleDismiss(id: string)`: call `dismissReminder(id)`, update tasks state with returned task, remove id from `activeAlerts`; update `handleToggle` to also call `stopAlarm()` and `setActiveAlerts(prev => prev.filter(a => a.id !== task.id))` when `!task.completed` (about to complete a task that may have an active alert); add a `useEffect` that calls `listenForNotificationActions(handleSnooze, handleDismiss)` on mount and returns the cleanup; pass `onSnooze={handleSnooze}` and `onDismiss={handleDismiss}` to `<ReminderBanner>`; also pass `isAlerting` prop down through `TaskList` and `DraggableTaskList` to `TaskCard` (update those components' prop types to forward `activeAlertIds: string[]`)

- [x] T019 [P] [US2] Update `app/components/TaskList.tsx` — add `activeAlertIds?: string[]` prop to `Props` type; pass `isAlerting={activeAlertIds?.includes(task.id) ?? false}` to each `<TaskCard>`

- [x] T020 [P] [US2] Update `app/components/DraggableTaskList.tsx` — add `activeAlertIds?: string[]` prop to the `Props` type and `SortableItemProps` type; pass `isAlerting={activeAlertIds?.includes(task.id) ?? false}` from `SortableItem` to `<TaskCard>`

**Checkpoint**: User Stories 1 AND 2 fully functional. Snooze re-triggers at correct time (persists through refresh). Dismiss prevents re-trigger. Disabling via modal stops future firing.

---

## Phase 5: User Story 3 — Responsive Card Grid (Priority: P2)

**Goal**: Replace the vertical flex list with a responsive CSS grid (1 col mobile → 2 col tablet → 3/4 col desktop). Drag-and-drop continues to work using rectSortingStrategy.

**Independent Test**: Open app at 375px, 768px, and 1280px widths. Verify 1→2→3/4 column layout. Verify no horizontal scrollbar. Verify drag-and-drop still works to reorder cards. Verify all card content (title, badges, reminder info, action buttons) is visible without truncation.

### Implementation for User Story 3

- [x] T021 [P] [US3] Update `app/components/TaskList.tsx` — change loading spinner wrapper from `<div>` back to `<div>` (no change); change the empty state wrapper (no change); change the task rendering container from `<ul className="flex flex-col gap-2">` to `<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">` and remove the `<li>` wrapper — since `TaskCard` renders its own `<li>`, update `TaskCard` to render a `<div>` instead of `<li>` as its root element so it is a valid grid child (update the element name in `TaskCard.tsx` from `<li>` to `<div>`)

- [x] T022 [US3] Update `app/components/DraggableTaskList.tsx` — replace import `verticalListSortingStrategy` with `rectSortingStrategy` from `@dnd-kit/sortable`; update `SortableContext strategy={verticalListSortingStrategy}` to `strategy={rectSortingStrategy}`; change the sortable items container from `<ul className="flex flex-col gap-2">` to `<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">` and wrap each `SortableItem` in `<div>` instead of no wrapper (the `setNodeRef` div is already there); update the empty state container element as needed; update the `DragOverlay` clone card wrapper to match grid card dimensions

**Checkpoint**: User Story 3 fully functional. All three breakpoints verified. DnD reorder works in grid layout. No regression in reminder display or action buttons.

---

## Phase 6: User Story 4 — Persist Reminder Data Across Sessions (Priority: P2)

**Goal**: All reminder state survives a page refresh. Reminder fires correctly even if page was refreshed before the trigger time. Snoozed reminders re-trigger at the correct time after refresh.

**Independent Test**: Set reminder 10 min from now → refresh → verify card shows "Reminder set" badge → wait → verify reminder fires. Set reminder → snooze → refresh → verify "Snoozed" badge remains → wait 5 min → verify re-trigger.

### Implementation for User Story 4

- [x] T023 [US4] Verify persistence is working correctly — this story is fulfilled entirely by the Phase 2 foundational work (DB fields + `notificationTriggered` flag + `snoozeUntil` DB field). Run the Phase 2 checkpoint tests. Then manually test quickstart.md Scenario 7 (reminder persists through refresh) and Scenario 8 (no duplicate trigger on refresh). If either scenario fails, debug the `useReminderChecker` hook's `tasksRef` update pattern and the `notificationTriggered` flag check. No new code should be needed — this task is a validation checkpoint only.

**Checkpoint**: All four user stories are independently functional. quickstart.md Scenarios 1–8 all pass.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Dark mode, build verification, and acceptance testing.

- [x] T024 Dark mode audit for new components — review `ReminderBanner.tsx` and `TaskCard.tsx` reminder info row: verify all new classes include `dark:` variants as per `REMINDER_STATUS_COLORS` (already defined with dark variants in T008); review the `animate-pulse ring-2 ring-amber-400` on the alerting card — add `dark:ring-amber-500` if not already present; open the app with dark mode enabled and verify banner, badge, and ring colors are correct

- [x] T025 [P] Run backend TypeScript build — `cd backend && npm run build` — must complete with zero TypeScript errors; if errors appear, fix DTO types and service method signatures

- [x] T026 [P] Run frontend TypeScript build — `npm run build` from repo root — must complete with zero TypeScript errors; if errors appear, fix component prop type mismatches (especially `activeAlertIds` passing and `isAlerting` propagation)

- [x] T027 Run quickstart.md acceptance scenarios 1–10 manually in Chrome — all scenarios must pass; pay special attention to: Scenario 2 (snooze re-trigger after page refresh), Scenario 8 (no duplicate on refresh), Scenario 9 (notification permission denied fallback to in-app banner)

- [x] T028 Run regression checklist from quickstart.md — verify all existing operations (create, edit, delete, toggle, filter, search, sort, drag-and-drop, dark mode, sidebar, progress bar) continue to work correctly after reminder feature is introduced

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1; BLOCKS all user story phases
- **US1 (Phase 3)**: Depends on Phase 2 completion — no dependencies on US2/US3/US4
- **US2 (Phase 4)**: Depends on Phase 3 completion (shares page.tsx state with US1)
- **US3 (Phase 5)**: Depends on Phase 2 completion — can run in parallel with Phase 3 (different files)
- **US4 (Phase 6)**: Depends on Phase 2 completion (already fulfilled by DB) — validation only
- **Polish (Phase 7)**: Depends on Phases 3–6 completion

### User Story Dependencies

- **US1 (P1)**: Must complete before US2 (shared page.tsx; US2 adds handlers to US1's state)
- **US2 (P1)**: Depends on US1 (extends same page.tsx)
- **US3 (P2)**: Independent of US1/US2 — different files (`TaskList.tsx`, `DraggableTaskList.tsx`)
- **US4 (P2)**: No additional implementation beyond Phase 2 DB work

### Parallel Opportunities Within Phases

- **Phase 2**: T004, T005, T007, T008 can all run in parallel after T002/T003 complete
- **Phase 3**: T010, T011 can run in parallel after T009; T013, T014 can run in parallel
- **Phase 4**: T019, T020 can run in parallel after T018
- **Phase 7**: T025, T026 can run in parallel; T027, T028 must run sequentially after builds pass

---

## Parallel Execution Examples

### Phase 2 (after T002 + T003)

```text
In parallel:
  Task T004: Update create-task.dto.ts (backend/src/tasks/dto/create-task.dto.ts)
  Task T005: Update update-task.dto.ts (backend/src/tasks/dto/update-task.dto.ts)
  Task T007: Update lib/api.ts
  Task T008: Update lib/constants.ts

Then sequentially:
  Task T006: Update tasks.service.ts (depends on T004 + T005 for DTO types)
```

### Phase 3 (after Phase 2)

```text
First:
  Task T009: Create public/sw.js

Then in parallel:
  Task T010: Create lib/reminderAudio.ts
  Task T011: Create lib/notificationService.ts

Then:
  Task T012: Create lib/useReminderChecker.ts (after T011 for type reference)

Then in parallel:
  Task T013: Update app/layout.tsx
  Task T014: Update app/components/TaskModal.tsx

Then sequentially:
  Task T015: Update app/page.tsx (depends on T012, T014)
  Task T016: Create app/components/ReminderBanner.tsx (after T015 for prop contract)
  Task T017: Update app/components/TaskCard.tsx (after T008 for constants)
```

---

## Implementation Strategy

### MVP (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational (T002–T008) — CRITICAL
3. Complete Phase 3: US1 reminder triggering (T009–T017)
4. Complete Phase 4: US2 snooze/dismiss (T018–T020)
5. **STOP and VALIDATE**: Test Scenarios 1–5 from quickstart.md
6. Ship MVP: working reminders with snooze/dismiss

### Full Feature Delivery

1. MVP above (US1 + US2)
2. Phase 5: US3 responsive grid (T021–T022) — visual improvement
3. Phase 6: US4 validation (T023) — confirm DB persistence
4. Phase 7: Polish (T024–T028) — build + acceptance tests

### Notes

- US3 (grid layout) is safe to implement in parallel with US1/US2 since it touches different files
- `snoozeUntil` is always computed server-side — never accept it from the frontend
- The `tasksRef` pattern in `useReminderChecker` is critical to avoid stale-closure bugs in the setInterval callback
- Audio unlock must happen before the first reminder fires — the `ClientInit` component's click handler ensures this
- Always test with browser notifications both allowed AND denied to verify the in-app fallback path
