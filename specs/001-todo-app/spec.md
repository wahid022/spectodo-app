# Feature Specification: Todo App

**Feature Branch**: `001-todo-app`

**Created**: 2026-05-15

**Status**: Draft

**Input**: User description: "Build a single-page to-do web app. The user can add a task, see all tasks in a list, mark a task as done (and undo), and delete a task. Tasks persist across page reloads via localStorage. The home page ("/") is the only page. Newest tasks appear at the top."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Add and View Tasks (Priority: P1)

A user visits the home page, types a task into an input field, and submits it. The new task immediately appears at the top of the task list. When no tasks exist, a clear empty-state message is displayed instead of a blank list.

**Why this priority**: Core functionality — without the ability to add and view tasks, no other feature is useful.

**Independent Test**: Open the app, add three tasks one by one, and verify they appear in reverse-add order (newest at top). Confirm an empty-state message shows before any task is added.

**Acceptance Scenarios**:

1. **Given** the task list is empty, **When** the user opens the app, **Then** an empty-state message is displayed.
2. **Given** an empty input field, **When** the user types a task description and presses Enter or clicks the "Add" button, **Then** the task appears at the top of the list.
3. **Given** one or more existing tasks, **When** the user adds a new task, **Then** the new task appears above all previous tasks.
4. **Given** an empty input field, **When** the user presses Enter or clicks the "Add" button without entering text, **Then** no task is added and the list is unchanged.

---

### User Story 2 - Mark Task as Done and Undo (Priority: P2)

A user can mark any task as completed, which visually distinguishes it (strikethrough) while keeping it in the list. The user can also un-mark a completed task to return it to active status.

**Why this priority**: Completion tracking is the primary purpose of a to-do app — delivering the core value of knowing what is done vs. pending.

**Independent Test**: Add a task, mark it done (confirm strikethrough appears and task remains in list), then un-mark it (confirm strikethrough disappears).

**Acceptance Scenarios**:

1. **Given** an active task, **When** the user marks it as done, **Then** the task displays with a strikethrough and remains visible in the list.
2. **Given** a completed task, **When** the user un-marks it, **Then** the strikethrough is removed and the task returns to active status.
3. **Given** a mix of active and completed tasks, **When** the user toggles one task, **Then** all other tasks are unaffected.

---

### User Story 3 - Delete a Task (Priority: P3)

A user can permanently remove any task — active or completed — from the list.

**Why this priority**: Deletion keeps the list manageable; it is additive functionality beyond core tracking.

**Independent Test**: Add two tasks, delete one, confirm only the remaining task is shown.

**Acceptance Scenarios**:

1. **Given** a task in the list, **When** the user deletes it, **Then** the task is immediately removed from the list.
2. **Given** a completed task, **When** the user deletes it, **Then** the task is permanently removed.
3. **Given** only one task, **When** the user deletes it, **Then** the empty-state message reappears.

---

### User Story 4 - Persist Tasks Across Page Reloads (Priority: P1)

All tasks — including their completion status — are saved automatically so they survive browser refreshes or navigation away and back to the page.

**Why this priority**: Without persistence, every page reload loses all data, making the app practically unusable.

**Independent Test**: Add two tasks, mark one done, reload the page, confirm both tasks and their completion states are restored exactly.

**Acceptance Scenarios**:

1. **Given** the user has added tasks, **When** the page is reloaded, **Then** all tasks appear in the same order with the same completion status.
2. **Given** the user has marked tasks done, **When** the page is reloaded, **Then** completed tasks still display as completed.
3. **Given** the user has deleted a task, **When** the page is reloaded, **Then** the deleted task does not reappear.

---

### Edge Cases

- What happens when the user submits a task containing only whitespace? (Treated as empty — no task is added.)
- What happens when very long task text is entered? (Text wraps within the list row without breaking layout.)
- What happens if browser-side storage is unavailable? (App degrades gracefully — tasks remain functional for the current session.)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to add a new task by entering text and either pressing Enter or clicking the "Add" button.
- **FR-002**: Users MUST see all tasks in a list ordered newest-first.
- **FR-003**: An empty-state message MUST be displayed when no tasks exist.
- **FR-004**: Submitting an empty or whitespace-only input MUST NOT create a task.
- **FR-005**: Users MUST be able to mark any task as completed; completed tasks MUST display with a strikethrough.
- **FR-006**: Users MUST be able to un-mark a completed task to return it to active status.
- **FR-007**: Completed tasks MUST remain visible in the list — they are never hidden or automatically removed.
- **FR-008**: Users MUST be able to permanently delete any task (active or completed).
- **FR-009**: All tasks and their completion states MUST persist automatically across page reloads.
- **FR-010**: The app MUST operate on a single page with no navigation or routing.
- **FR-011**: All interactive controls (input field, Add button, task toggle, delete button) MUST be keyboard-accessible and MUST have appropriate ARIA labels to meet WCAG 2.1 AA compliance.

### Key Entities

- **Task**: Represents a to-do item. Key attributes: unique identifier, text description, completion status, creation timestamp.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can add their first task in under 10 seconds from opening the app.
- **SC-002**: Tasks appear in the list immediately after being added, with no page refresh required.
- **SC-003**: 100% of tasks and their completion states are restored correctly after a page reload.
- **SC-004**: All core interactions (add, complete, undo, delete) are reachable on a single page without any navigation.
- **SC-005**: The app correctly handles at least 50 tasks without display or persistence issues.
- **SC-006**: All core interactions (add, toggle, delete) are fully operable via keyboard alone, with no mouse required.

## Assumptions

- Target users are individuals managing personal tasks on a desktop or mobile browser.
- No authentication or multi-user support is required.
- No synchronisation across devices or browsers is needed.
- The app need not support browsers that lack client-side storage capability.
- Sort order is fixed as newest-first; no manual reordering or alternative sort is required.
- Editing the text of an existing task is out of scope for this feature.
- No due dates, priorities, or categories are required.

## Clarifications

### Session 2026-05-15

- Q: How does a user submit a new task? → A: Either pressing Enter OR clicking the "Add" button (both work)
- Q: Is keyboard accessibility (WCAG 2.1 AA compliance) required? → A: Yes — full WCAG 2.1 AA compliance required; all controls keyboard-accessible with proper ARIA labels
