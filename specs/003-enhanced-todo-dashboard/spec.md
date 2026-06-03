# Feature Specification: Enhanced Todo Dashboard

**Feature Branch**: `003-enhanced-todo-dashboard`

**Created**: 2026-05-19

**Status**: Draft

**Input**: User description: "Include CRUD operations, task categories, priority levels, due dates, edit/delete, filters, search, progress bar, dark mode, drag-and-drop reordering, toast notifications, responsive dashboard UI, smooth animations, and deployment-ready environment configuration with clean architecture and production-level code quality."

---

## Clarifications

### Session 2026-05-19

- Q: When a user wants to edit a task, how should the edit experience work? → A: A centered modal dialog opens with a full edit form showing all task fields (title, category, priority, due date).
- Q: When a user has manually reordered tasks via drag-and-drop and then applies a sort, what happens to their custom order? → A: Applied sort is a temporary view lens; clearing the sort restores the previous custom drag order.
- Q: Should task categories be stored in the database as a separate table or as a fixed enum on the Task row? → A: Hardcoded string enum stored directly on the Task row — no separate Category table needed.
- Q: When a user performs an action (create, toggle, delete, edit), should the UI update immediately or wait for API confirmation? → A: Pessimistic: UI waits for API confirmation; a loading indicator shows on the affected row during the request; on failure, an error toast with a retry button appears.
- Q: Where does the "Add Task" action live in the UI? → A: A floating "+" action button (FAB) fixed in the bottom-right corner; clicking it opens the same centered modal used for editing, pre-filled with empty fields.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Create, View, and Manage Tasks (Priority: P1)

A user opens the dashboard and immediately sees all their tasks in a visually rich list. They click the floating "+" button in the bottom-right corner — a centered modal opens where they fill in a title, select a category (e.g. Work, Personal, Health), choose a priority (Low, Medium, High, Urgent), and optionally set a due date. On save, the task appears at the top with a slide-in animation and a success toast. They can later click the edit icon on any task row to open the same modal pre-filled with that task's data, or click delete to permanently remove it.

**Why this priority**: Core CRUD is the irreducible foundation — nothing else works without it. Must be solid, fast, and visually polished before any enhancement is built on top.

**Independent Test**: Open the app, add a task with title "Buy groceries", category "Personal", priority "High", due date tomorrow. Confirm it appears in the list with correct badge colors. Edit the title to "Buy groceries and cook". Confirm the change persists after page refresh. Delete the task — confirm it disappears with a toast.

**Acceptance Scenarios**:

1. **Given** the dashboard is open, **When** the user clicks the FAB and submits the modal with valid data, **Then** the modal closes, a loading indicator appears briefly, and the new task appears at the top of the list with a slide-in animation and a "Task created" toast.
2. **Given** a task exists, **When** the user clicks the edit icon, **Then** a centered modal opens with all task fields pre-filled; on save, the updated task is reflected in the list immediately without a page reload and a "Task updated" toast appears.
3. **Given** a task exists, **When** the user clicks delete and confirms, **Then** the task is removed from the list and a "Task deleted" toast appears.
4. **Given** the user opens the create modal and leaves the title empty, **When** they click Save, **Then** an inline validation message appears inside the modal and no task is created.
5. **Given** a task has a due date of today, **When** it is displayed, **Then** the due date is highlighted in amber to signal urgency.
6. **Given** a task is overdue, **When** it is displayed, **Then** the due date is highlighted in red.

---

### User Story 2 — Filter, Search, and Sort Tasks (Priority: P2)

A user with many tasks wants to find specific items quickly. They type in a search box and the list filters in real time as they type. They can also click filter chips to narrow by status (All / Active / Completed), category, or priority level. A sort dropdown lets them order by due date, creation date, or priority. All filters compose together — for example: "High priority Work tasks due this week."

**Why this priority**: Without findability, the app becomes unusable as task count grows. This is the feature that turns a toy into a real productivity tool.

**Independent Test**: Add 10 tasks across different categories and priorities. Type "gym" in the search box — only matching tasks appear. Click the "High" priority chip — list narrows further. Clear search — filtered list by priority alone remains.

**Acceptance Scenarios**:

1. **Given** tasks exist, **When** the user types in the search box, **Then** the list filters in real time to show only tasks whose title contains the search string (case-insensitive).
2. **Given** the user has selected the "Completed" filter, **When** tasks are displayed, **Then** only completed tasks are shown.
3. **Given** filters are combined (e.g. category = Work AND priority = High), **When** the list renders, **Then** only tasks matching all active filters appear.
4. **Given** no tasks match the active filters, **When** the list renders, **Then** an illustrated empty-state message is shown.
5. **Given** a sort option is selected, **When** the list renders, **Then** tasks are ordered according to the selected criterion.
6. **Given** the user clears all filters, **When** the list renders, **Then** all tasks reappear in the default sort order.

---

### User Story 3 — Track Progress with a Dashboard Summary (Priority: P2)

At the top of the dashboard, a summary bar shows the user a snapshot of their productivity: total tasks, how many are completed, a completion percentage, and a visual progress bar that animates as tasks are checked off. A breakdown by category shows per-category progress rings or mini bars.

**Why this priority**: Progress visibility is a core motivational driver. Users need to see the impact of completing tasks. Pairs with US1 — every toggle immediately updates the summary.

**Independent Test**: Add 4 tasks, complete 2 of them. The progress bar shows 50% and animates smoothly. Complete a third — bar animates to 75%. The category breakdown reflects the correct ratio per category.

**Acceptance Scenarios**:

1. **Given** tasks exist, **When** the dashboard loads, **Then** the summary section shows total count, completed count, and a progress bar reflecting the completion percentage.
2. **Given** the user marks a task complete, **When** the checkbox is toggled, **Then** the progress bar animates to the new percentage within 300 ms.
3. **Given** all tasks are complete, **When** the dashboard renders, **Then** the progress bar shows 100% with a celebratory visual indicator (e.g. color change or confetti).
4. **Given** no tasks exist, **When** the dashboard renders, **Then** the progress bar shows 0% with a friendly prompt to add the first task.

---

### User Story 4 — Reorder Tasks with Drag and Drop (Priority: P3)

A user wants to manually prioritise tasks by dragging them into a custom order. They grab a task row by a drag handle on the left edge, drag it above or below other tasks, and release. The new order is persisted so it survives a page refresh.

**Why this priority**: Custom ordering is a power-user feature that adds significant perceived quality and polish. It does not block any core workflow.

**Independent Test**: Add 3 tasks A, B, C. Drag C to the top. After page refresh the order is C, A, B.

**Acceptance Scenarios**:

1. **Given** multiple tasks are visible, **When** the user drags a task by its handle, **Then** a ghost/placeholder shows the insertion point and other tasks shift smoothly.
2. **Given** the user drops the task at a new position, **Then** the list reorders instantly and the new order is saved.
3. **Given** drag-and-drop is not available (touch device without pointer support), **Then** up/down arrow buttons are shown as a fallback.
4. **Given** a search, filter, or sort is active, **When** the user attempts to drag, **Then** drag-and-drop is disabled and a tooltip explains why.
5. **Given** the user has a custom drag order and applies a sort (e.g. by due date), **When** they clear the sort, **Then** the original custom drag order is fully restored.

---

### User Story 5 — Dark Mode and Responsive Layout (Priority: P3)

A user can toggle between light and dark mode using a button in the header. Their preference is remembered between sessions. On mobile, the layout collapses to a single-column view with a bottom navigation bar; on tablet and desktop, a sidebar shows category navigation. All transitions between light and dark are smooth (no flash).

**Why this priority**: Dark mode and responsiveness are table-stakes for a modern production app. They significantly affect perceived quality and accessibility.

**Independent Test**: Toggle dark mode — the entire UI switches color scheme instantly with no white flash. Refresh the page — dark mode preference is retained. Resize the browser to 375 px width — the layout collapses correctly, sidebar hides, all task actions remain accessible.

**Acceptance Scenarios**:

1. **Given** the user clicks the dark mode toggle, **When** the UI transitions, **Then** all colors switch within 200 ms with no unstyled flash.
2. **Given** dark mode is active, **When** the user refreshes the page, **Then** dark mode is still active.
3. **Given** the viewport is under 768 px, **When** the page renders, **Then** the sidebar is hidden and all functionality is accessible via the main panel and a bottom or hamburger navigation.
4. **Given** the viewport is 768 px or wider, **When** the page renders, **Then** a fixed sidebar shows category counts and navigation.

---

### Edge Cases

- What happens when a task title is exactly 255 characters?
- What happens when the backend is unreachable and the user tries to add a task?
- What happens when two browser tabs are open and a task is deleted in one?
- What happens when the user drags a task while a filter is active?
- What happens when due date is set in the past at creation time?
- What happens if the user has 500+ tasks — does the list remain performant?

---

## Requirements *(mandatory)*

### Functional Requirements

**CRUD & Task Fields**

- **FR-001**: Users MUST be able to create a task via a floating "+" action button (FAB) fixed to the bottom-right of the screen. Clicking the FAB opens a centered modal with fields: title (required, max 255 chars), category (required, from predefined enum), priority level (Low / Medium / High / Urgent, required), and due date (optional). The same modal component is reused for editing existing tasks.
- **FR-002**: Users MUST be able to edit any field of an existing task (title, category, priority, due date) via a centered modal dialog; changes are saved without a page reload and the modal closes on save.
- **FR-003**: Users MUST be able to delete a task; deletion must be permanent and confirmed via a toast notification.
- **FR-004**: Users MUST be able to mark a task complete or incomplete; the toggle must update the progress bar immediately.
- **FR-005**: System MUST display overdue tasks with a visual red highlight on the due date; due-today tasks with amber highlight.

**Categories & Priority**

- **FR-006**: System MUST support exactly 5 predefined categories stored as string enums on the Task: `Work`, `Personal`, `Health`, `Finance`, `Learning`. Each category MUST have a distinct color badge resolved by the frontend — no separate Category table exists in the database.
- **FR-007**: System MUST support 4 priority levels: Low (grey), Medium (blue), High (amber), Urgent (red). Priority MUST be displayed as a colored badge on each task row.

**Filters, Search & Sort**

- **FR-008**: System MUST provide real-time search filtering by task title (case-insensitive, client-side).
- **FR-009**: System MUST provide filter controls for: status (All / Active / Completed), category (multi-select), and priority (multi-select).
- **FR-010**: System MUST provide sort options: by creation date (default), due date, and priority level. All sort views are temporary — clearing a sort restores the user's custom drag order.
- **FR-011**: All active filters and search query MUST compose together (AND logic).
- **FR-012**: When no tasks match active filters, System MUST display an illustrated empty state with a "Clear filters" action.

**Progress Tracking**

- **FR-013**: Dashboard MUST show a summary header with: total task count, completed count, completion percentage, and an animated progress bar.
- **FR-014**: Progress bar MUST animate smoothly whenever the completion count changes.
- **FR-015**: System MUST show per-category task counts in the sidebar or category filter panel.

**Drag and Drop**

- **FR-016**: Users MUST be able to reorder tasks via drag-and-drop using a visible drag handle on each row.
- **FR-017**: The custom drag order MUST persist across page refreshes and MUST be restored when an applied sort is cleared.
- **FR-017a**: Applying a sort option (due date, priority) is a temporary view lens — it does NOT overwrite the stored custom drag order.
- **FR-018**: When a filter, search, or sort is active, drag-and-drop MUST be disabled with a visible explanation.
- **FR-019**: System MUST provide up/down arrow buttons as a drag-and-drop fallback on touch-only devices.

**Toast Notifications**

- **FR-020**: System MUST display non-blocking toast notifications for: task created, task updated, task deleted, and error states. UI MUST NOT update until the API confirms the action (pessimistic update strategy).
- **FR-020a**: While any task operation (create, toggle, delete, edit) is in-flight, the affected row or button MUST display a loading indicator (spinner or shimmer); the action MUST be non-repeatable until resolved.
- **FR-021**: Toasts MUST auto-dismiss after 4 seconds and MUST be manually dismissible.
- **FR-022**: Error toasts MUST include a "Retry" action where applicable; on retry the loading indicator re-appears until the API responds.

**Dark Mode & Theming**

- **FR-023**: System MUST provide a light/dark mode toggle in the main header.
- **FR-024**: Theme preference MUST be persisted across browser sessions.
- **FR-025**: Theme transition MUST be smooth (no unstyled content flash).

**Responsive Layout**

- **FR-026**: Dashboard MUST be fully usable at viewport widths from 375 px (mobile) to 1440 px (desktop).
- **FR-027**: On mobile (< 768 px), the sidebar MUST collapse and all task actions MUST remain accessible.
- **FR-028**: On desktop (≥ 1024 px), a fixed sidebar MUST show category navigation and per-category task counts.

**Animations**

- **FR-029**: Task additions MUST animate with a slide-in effect.
- **FR-030**: Task deletions MUST animate with a fade-out/collapse effect before removal.
- **FR-031**: All interactive elements (buttons, checkboxes, drag handles) MUST have hover and focus states with smooth transitions (≤ 150 ms).

**Environment & Deployment**

- **FR-032**: All environment-specific values (API URLs, feature flags) MUST be configured via environment variables, not hardcoded.
- **FR-033**: Application MUST build without errors for a production deployment target.

### Key Entities

- **Task**: Represents a single to-do item. Key attributes: id, title, category (string enum), priority (string enum), completed, dueDate, sortOrder, createdAt, updatedAt.
- **Category**: A fixed string enum value stored on the Task row — no separate DB table. Values: `Work`, `Personal`, `Health`, `Finance`, `Learning`. Display color is resolved by the frontend from the enum value.
- **Priority**: A fixed string enum value stored on the Task row. Values: `Low`, `Medium`, `High`, `Urgent`. Display color and sort weight are resolved by the frontend.
- **Filter State**: The active combination of search query, status filter, category filter, priority filter, and sort option. Client-side only, not persisted.
- **Theme Preference**: User's chosen light/dark mode. Persisted in browser storage.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create, edit, and delete a task in under 30 seconds from a cold page load.
- **SC-002**: Search results update within 100 ms of the user stopping typing.
- **SC-003**: The progress bar animation completes within 300 ms of a task being toggled.
- **SC-004**: Dark mode toggles without any unstyled content flash, completing the transition within 200 ms.
- **SC-005**: The dashboard is fully functional on screens from 375 px to 1440 px wide without horizontal scrolling.
- **SC-006**: All task actions (add, edit, delete, toggle, reorder) display a per-row loading indicator immediately on click, and a success or error toast within 500 ms of API response.
- **SC-007**: Page fully loads and is interactive within 3 seconds on a standard broadband connection.
- **SC-008**: Drag-and-drop reorder persists correctly across 100% of test page refreshes.
- **SC-009**: The application builds for production with zero TypeScript errors and zero lint violations.

---

## Assumptions

- The existing NestJS + PostgreSQL + Prisma backend from spec `002-nestjs-postgres-backend` will be extended (not replaced) to support new task fields (category, priority, dueDate, sortOrder).
- Categories are predefined by the system; users cannot create custom categories in this version.
- Drag-and-drop order is stored as a numeric `sortOrder` field on the Task entity in the database.
- The 5 predefined categories (`Work`, `Personal`, `Health`, `Finance`, `Learning`) are string enums stored directly on the Task row — no Category table is created in the database.
- Authentication is out of scope — all tasks are global (single-user environment).
- Pagination is not required; the list renders all tasks with virtualisation if performance requires it.
- The visual design direction is a modern, polished dashboard: card-based layout, vibrant priority/category color badges, smooth micro-animations, and a clean typographic hierarchy — inspired by tools like Linear, Notion, and Todoist.
- Toast notifications are rendered in a fixed overlay and do not shift page layout.
- No real-time multi-tab sync is required in this version.
