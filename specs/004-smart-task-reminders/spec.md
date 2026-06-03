# Feature Specification: Smart Task Reminder System with Responsive Card UI

**Feature Branch**: `004-smart-task-reminders`

**Created**: 2026-05-19

**Status**: Draft

**Input**: User description: "Build an enhanced task management experience for the existing Todo application with task reminder system and responsive card-based UI"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Set and Receive Task Reminders (Priority: P1)

A user wants to be reminded about a task at a specific time. When creating or editing a task, they set a due date and a reminder time. At the configured time, they receive a desktop notification, hear an alarm sound, and see the task card visually highlighted. If they have previously denied browser notification permission, an in-app alert appears instead.

**Why this priority**: This is the core value proposition of the feature. Without reliable reminder delivery, the feature has no purpose.

**Independent Test**: Create a task with a reminder time set 1 minute from now. Wait for the time to arrive. Verify a notification appears (or in-app alert if permission denied), an alarm sound plays, and the task card is visually highlighted with a pulsing animation.

**Acceptance Scenarios**:

1. **Given** a task with `reminderTime` set to 10:30 AM, **When** the system clock reaches 10:30 AM, **Then** a desktop notification appears with the task title, an alarm sound begins playing, and the task card pulses/highlights visually.
2. **Given** the reminder has triggered, **When** the user has not interacted with it after a configurable timeout (default: 5 minutes), **Then** the alarm sound stops automatically.
3. **Given** the browser notification permission has been denied, **When** a reminder triggers, **Then** an in-app banner alert displays prominently with the task title and action buttons.
4. **Given** a reminder has already triggered once, **When** the scheduled time passes again (e.g., after page refresh within the same minute), **Then** no duplicate reminder fires.

---

### User Story 2 - Snooze, Dismiss, and Disable Reminders (Priority: P1)

After a reminder triggers, the user needs to act on it. They can snooze it to re-trigger in 5 minutes, dismiss it permanently, or they can proactively disable a reminder before it triggers if they no longer need it.

**Why this priority**: Without snooze/dismiss controls, reminders become a nuisance rather than a tool. This is essential to core usability alongside US1.

**Independent Test**: Trigger a reminder, then click "Snooze 5 min" — the alarm stops, the highlight clears, and a new notification appears 5 minutes later. Trigger again, click "Dismiss" — alarm stops, highlight clears, card returns to normal. Edit a task with a future reminder and disable it — no notification fires at the configured time.

**Acceptance Scenarios**:

1. **Given** an active reminder alert (notification or in-app), **When** the user clicks "Snooze 5 min", **Then** the alarm sound stops, the visual highlight clears, and the reminder re-triggers exactly 5 minutes later.
2. **Given** an active reminder alert, **When** the user clicks "Dismiss", **Then** the alarm stops, the visual highlight clears, and the reminder does not re-trigger.
3. **Given** a task with a future reminder time, **When** the user opens the task and disables the reminder toggle, **Then** no notification fires at the originally configured reminder time.
4. **Given** a snoozed reminder, **When** the user completes the task before the snooze expires, **Then** the snoozed reminder does not fire.

---

### User Story 3 - View Tasks as Responsive Cards (Priority: P2)

A user views their tasks in a card-based layout rather than a flat list. Each card shows all relevant information at a glance: title, completion status, due date, reminder time, and reminder enabled/disabled state. The layout adapts to screen size — single column on mobile, two columns on tablet, and three to four columns on desktop. Reminder-active cards pulse visually to draw attention.

**Why this priority**: The card UI is a significant UX improvement and a required container for displaying reminder state. It is secondary to working reminders.

**Independent Test**: Open the app on a phone (or emulated mobile), tablet, and desktop. Verify single-column → two-column → three/four-column layout respectively. Verify no horizontal scrolling occurs. Verify each card shows title, due date, reminder time, and reminder status badge.

**Acceptance Scenarios**:

1. **Given** a list of tasks, **When** the user opens the app on a mobile device (<768px wide), **Then** tasks display in a single-column vertical card layout with no horizontal overflow.
2. **Given** the same task list, **When** the user views on a tablet (768px–1023px wide), **Then** tasks display in a two-column card grid.
3. **Given** the same task list, **When** the user views on a desktop (≥1024px wide), **Then** tasks display in a three-to-four-column responsive card grid.
4. **Given** a task with an active reminder, **When** the reminder has triggered, **Then** the card visually pulses or highlights with a distinct color/animation to indicate urgency.
5. **Given** 100+ tasks, **When** the card grid renders, **Then** the page remains scrollable and interactive without visible performance degradation.

---

### User Story 4 - Persist Reminder Data Across Sessions (Priority: P2)

When a user sets a reminder, that configuration persists. After a page reload or new browser session, the reminder time, status (enabled/disabled/snoozed), and whether the notification already fired are all correctly restored. A reminder that has not yet fired will trigger at the correct time even after a page refresh.

**Why this priority**: Without persistence, reminders are ephemeral and unreliable across sessions — reducing trust in the feature.

**Independent Test**: Set a reminder 10 minutes in the future. Refresh the page. Verify the reminder time and enabled status are still displayed. Wait for the time — verify the notification fires correctly.

**Acceptance Scenarios**:

1. **Given** a task with `reminderTime` set and `reminderEnabled = true`, **When** the user refreshes the page, **Then** the task card still shows the correct reminder time and the "enabled" indicator.
2. **Given** a reminder that already triggered and was dismissed, **When** the user refreshes the page, **Then** the reminder does not re-fire and the card shows "reminder dismissed" status.
3. **Given** a snoozed reminder with 3 minutes remaining, **When** the user refreshes the page, **Then** the snooze countdown continues and the reminder fires at the correct time.

---

### Edge Cases

- What happens when the user's system clock is incorrect or jumps forward?
- What happens when the browser tab is backgrounded or the device goes to sleep when the reminder should trigger?
- What happens when the user sets a reminder time in the past?
- What happens when multiple tasks have reminders within the same minute?
- What happens if the alarm audio file fails to load?
- What happens when a task is deleted while its reminder is actively alerting?
- What happens when the user clicks snooze multiple times in a row?

## Requirements *(mandatory)*

### Functional Requirements

**Reminder Setup**

- **FR-001**: Users MUST be able to assign a reminder time (date + time) to any task when creating or editing it.
- **FR-002**: Users MUST be able to enable or disable the reminder for a task independently of setting its time.
- **FR-003**: System MUST validate that a reminder time is not set in the past at the moment of saving; if so, the system MUST display a clear warning.

**Reminder Triggering**

- **FR-004**: System MUST trigger a reminder notification at the exact configured reminder time (within a 60-second tolerance due to polling).
- **FR-005**: System MUST play an audible alarm when a reminder triggers.
- **FR-006**: System MUST visually highlight (pulse/glow animation) the task card when its reminder triggers.
- **FR-007**: System MUST prevent duplicate reminder triggers for the same task within a single session.

**Notification Delivery**

- **FR-008**: System MUST request browser notification permission on first reminder setup and display a desktop notification when permission is granted.
- **FR-009**: System MUST fall back to an in-app banner alert when browser notification permission is denied or unavailable.
- **FR-010**: Desktop notifications MUST include the task title and action buttons for snooze and dismiss.

**Reminder Interaction**

- **FR-011**: Users MUST be able to snooze an active reminder; the alarm stops and re-triggers after exactly 5 minutes.
- **FR-012**: Users MUST be able to dismiss an active reminder; the alarm stops and does not re-trigger.
- **FR-013**: The alarm sound MUST stop automatically if the user does not interact with it within 5 minutes of triggering.
- **FR-014**: Users MUST be able to disable a reminder on any task before it triggers; doing so prevents the notification from firing.
- **FR-015**: Completing a task MUST automatically cancel any pending or snoozed reminder for that task.

**Card UI**

- **FR-016**: The task view MUST replace the existing list layout with a card-based grid layout.
- **FR-017**: Each task card MUST display: title, completion status, due date (if set), reminder time (if set), reminder enabled/disabled status, and action buttons (complete, delete; snooze/dismiss if reminder is active).
- **FR-018**: Task cards MUST have rounded corners, soft drop shadows, hover animations, and smooth state transitions.
- **FR-019**: Cards whose reminders are actively triggering MUST display a distinct pulsing or highlighted visual state.

**Responsive Layout**

- **FR-020**: The card grid MUST display as a single column on viewports narrower than 768px.
- **FR-021**: The card grid MUST display as two columns on viewports 768px–1023px wide.
- **FR-022**: The card grid MUST display as three or four columns on viewports 1024px and wider.
- **FR-023**: No horizontal scrolling MUST occur at any supported viewport width.

**Persistence**

- **FR-024**: Reminder time, enabled/disabled status, and triggered state MUST persist in the database across page refreshes and new sessions.
- **FR-025**: System MUST expose reminder fields via the existing REST API so clients can read and update reminder configuration.

### Key Entities

- **Task** (extended): Existing entity with new reminder fields — `reminderTime` (specific date+time), `reminderEnabled` (boolean, default false), `reminderStatus` (enum: `pending`, `triggered`, `snoozed`, `dismissed`), `notificationTriggered` (boolean, prevents duplicate fires).
- **ReminderAlert**: Transient client-side state representing an actively firing reminder — includes task reference, snooze count, alarm handle.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A reminder triggers within 60 seconds of its configured time, measured across 10 consecutive test cases with varying reminder windows.
- **SC-002**: Alarm sound plays within 1 second of the reminder trigger in 100% of test cases where audio permission is granted.
- **SC-003**: The card layout renders correctly (correct column count, no horizontal overflow) on all three viewport breakpoints as verified by manual testing across at least 3 device sizes.
- **SC-004**: Duplicate reminder protection prevents more than one notification per task per trigger event, validated by refreshing the page immediately after a reminder fires and confirming no second notification appears.
- **SC-005**: The card grid with 100 tasks renders and becomes interactive within 3 seconds on a standard consumer device.
- **SC-006**: All existing task operations (create, edit, delete, toggle, drag-and-drop, filter, search) continue to function correctly after the feature is introduced, with zero regression failures.
- **SC-007**: Snooze correctly re-triggers after exactly 5 minutes (±60 seconds tolerance) in 100% of tested cases.

## Assumptions

- The application runs in a modern browser that supports the Web Notifications API and HTML Audio API; no native mobile app wrapper is in scope.
- Background tab reminder triggering depends on browser tab activity; reminders may be delayed if the browser aggressively throttles background timers — this is considered acceptable behavior and will be documented for users.
- The alarm sound asset will be a short audio file (≤10 seconds) bundled with the frontend; selection of the specific sound is a design detail resolved during planning.
- Browser notification permission is requested lazily (when the user first enables a reminder), not on app load.
- "Reminder time" is always a full date+time value, not a recurring schedule (no "remind me every day at 9am" scope in this version).
- The frontend polling interval for checking due reminders is 30 seconds — a lightweight approach that avoids WebSocket complexity while remaining responsive enough for the 60-second trigger tolerance.
- Snooze is limited to a single level — after snoozing and the re-trigger fires, only dismiss is available (no chained snoozes), keeping UX simple.
- The existing `dueDate` field on tasks is already present in the database; `reminderTime` is a separate, distinct field that represents when the notification fires (which may differ from the due date).
- All users of the application are trusted (no multi-user auth in scope); reminders are personal to the browser session.
