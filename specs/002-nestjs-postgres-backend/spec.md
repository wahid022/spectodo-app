# Feature Specification: Backend-Powered Todo App

**Feature Branch**: `002-nestjs-postgres-backend`

**Created**: 2026-05-18

**Status**: Draft

**Input**: User description: "Upgrade the existing single-page Todo App to use a proper backend with NestJS, PostgreSQL, and Prisma ORM. Replace localStorage persistence with database storage. Implement CRUD APIs for tasks (create, read, update status, delete), ensure newest tasks appear first, keep the home page as '/', and make the backend deployment-ready using free platforms."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Add and View Tasks (Priority: P1)

A user opens the app at "/" and sees a loading indicator while tasks are being
fetched. Once loaded, tasks appear listed newest-first. The user types a new
task title and submits it; the task immediately appears at the top of the list
without requiring a page refresh. If the user refreshes the browser or opens
the app in a new tab, all tasks are still there exactly as they left them.

**Why this priority**: Persistent task creation and retrieval is the foundational
value of the app. Without it, nothing else works.

**Independent Test**: Open the app, add three tasks, refresh the browser. Verify
all three tasks appear in newest-first order and that no task data is lost.

**Acceptance Scenarios**:

1. **Given** the user opens the app, **When** tasks are being fetched, **Then**
   a loading indicator is visible until data arrives.
2. **Given** the app is open with no tasks, **When** the user types "Buy groceries"
   and submits, **Then** the task appears at the top of the list instantly.
3. **Given** tasks exist, **When** the user refreshes the page, **Then** all
   tasks are displayed in the same newest-first order.
4. **Given** the user submits an empty title or one containing only spaces,
   **When** the form is submitted, **Then** the task is rejected and no new item
   appears in the list.

---

### User Story 2 - Toggle Task Completion (Priority: P2)

A user clicks a checkbox or button on a task to mark it complete. The task
displays a visual indicator (e.g., strikethrough) confirming it is done. The
user can click again to mark it incomplete. The task remains in its original
position in the list regardless of completion status.

**Why this priority**: Tracking completion state is the core workflow of any
todo app; it directly determines whether the app is useful day-to-day.

**Independent Test**: Add a task, mark it complete, verify the visual indicator
appears. Refresh the browser and verify the task is still shown as complete.

**Acceptance Scenarios**:

1. **Given** an incomplete task, **When** the user marks it complete, **Then**
   a visual completion indicator appears and the task stays in its original position.
2. **Given** a completed task, **When** the user undoes completion, **Then**
   the indicator is removed and the task remains in its original position.
3. **Given** a completed task, **When** the browser is refreshed, **Then** the
   task still shows its completed state.

---

### User Story 3 - Delete a Task (Priority: P2)

A user clicks a delete control on any task. The task is removed from the list
immediately — no confirmation dialog is shown. The deletion is permanent; a
refresh confirms the task is gone.

**Why this priority**: Task deletion is essential for list hygiene and completes
the full CRUD surface for users.

**Independent Test**: Add a task, delete it, verify it disappears immediately.
Refresh and verify the task is not restored.

**Acceptance Scenarios**:

1. **Given** a task in the list, **When** the user clicks delete, **Then** the
   task is removed immediately with no confirmation prompt.
2. **Given** a deleted task, **When** the user refreshes the page, **Then** the
   task does not reappear.

---

### User Story 4 - Error Feedback (Priority: P3)

If the data service is unavailable, the user sees a clear, human-readable
error message rather than a blank page or silent failure. The error appears
without requiring any action from the user.

**Why this priority**: Error visibility is important for trust but does not
block the core task management workflow.

**Independent Test**: Simulate a backend outage and load the app. Verify that
a non-technical error message is displayed within three seconds.

**Acceptance Scenarios**:

1. **Given** the data service is unreachable, **When** the user loads the app,
   **Then** a clear error message and a retry button are displayed within three
   seconds.
2. **Given** the data service is unreachable, **When** the user tries to add
   a task, **Then** a clear error message and a retry button are displayed.
3. **Given** an error state with a retry button visible, **When** the user clicks
   retry and the service is restored, **Then** the operation succeeds and the
   error message is dismissed.

---

### Edge Cases

- What happens when a task title is empty or only whitespace? → Rejected before
  submission; no task is created.
- What happens if two tasks are created nearly simultaneously? → Both are saved;
  the most recently created appears first.
- What if a title exceeding 255 characters is submitted? → Rejected with a
  clear character-limit error message; no task is created.
- What if the data service returns an error mid-operation? → The UI displays
  a specific error for that operation without crashing or losing existing data.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to create a task by providing a non-empty title
  of up to 255 characters.
- **FR-002**: Empty or whitespace-only task titles MUST be rejected before
  submission; the user MUST receive feedback that the title is required.
- **FR-002a**: Task titles exceeding 255 characters MUST be rejected; the user
  MUST receive feedback indicating the character limit.
- **FR-003**: All tasks MUST be displayed ordered by creation time, newest first.
- **FR-004**: All task data MUST persist across browser refreshes and new sessions
  without any manual save action by the user.
- **FR-005**: Users MUST be able to mark a task as complete and undo that action.
- **FR-006**: Completed tasks MUST remain visible in the list in their original
  position with a visual indicator distinguishing them from incomplete tasks.
- **FR-007**: Users MUST be able to delete a task; deletion MUST be immediate
  with no confirmation dialog.
- **FR-008**: If any data operation fails, the UI MUST display a clear,
  human-readable error message alongside a retry button that re-attempts the
  failed operation without requiring a full page reload.
- **FR-009**: The application MUST be accessible at the root path "/".
- **FR-010**: While tasks are being fetched from the data service, the UI MUST
  display a loading indicator (spinner or skeleton rows) until data is available.
- **FR-011**: The backend data service MUST accept cross-origin requests from
  the frontend's deployed domain; all other origins MUST be rejected.

### Key Entities *(include if feature involves data)*

- **Task**: Represents a single to-do item. Key attributes: unique identifier,
  title (text, 1–255 characters), completion status (boolean), creation timestamp,
  last-updated timestamp. No relationships to other entities.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can add a new task and see it at the top of the list
  within two seconds of submitting.
- **SC-002**: All tasks are present and in correct newest-first order within
  two seconds of the page loading or refreshing.
- **SC-003**: Toggling completion or deleting a task is reflected in the UI
  within two seconds, with no manual page refresh required.
- **SC-004**: Task data survives 100% of browser refreshes — no tasks are lost
  between sessions.
- **SC-005**: When the data service is unavailable, a user-facing error message
  appears within three seconds of attempting any operation.

## Assumptions

- The application is a single-page application served at the root URL "/";
  no client-side routing to other paths is required.
- A dedicated server-side data layer handles all task persistence; no browser
  storage mechanisms are used for permanent data.
- The backend service will be deployed to a free cloud platform; all sensitive
  configuration is provided through environment variables, never hardcoded.
- The frontend and backend are deployed as separate services on different origins;
  the backend MUST allow cross-origin requests from the frontend's domain.
- No authentication or user accounts are in scope; all tasks belong to a single
  shared list.
- Task editing (changing the title after creation) is out of scope.
- Due dates, categories, tags, notifications, and file attachments are out of scope.
- The application is designed for a single user; multi-user or team features
  are out of scope.
- All tasks are loaded in a single request with no pagination; the design is
  optimized for up to approximately 500 tasks per list.

## Clarifications

### Session 2026-05-18

- Q: What should the UI show while tasks are being fetched on initial page load? → A: Show a loading indicator (spinner or skeleton rows) until data is available.
- Q: Should the task list support pagination or load all tasks at once? → A: No pagination — load all tasks in a single request (optimized for up to ~500 tasks).
- Q: What is the maximum allowed character length for a task title? → A: 255 characters; titles exceeding this MUST be rejected with user-facing feedback.
- Q: Should the error UI include a retry action or just a message? → A: Display error message with a retry button that re-attempts the failed operation.
- Q: Will the frontend and backend share an origin or run on different domains? → A: Different origins — backend MUST allow cross-origin requests from the frontend's domain via CORS.
