# Quickstart & Acceptance Test Guide: Smart Task Reminder System

## Prerequisites

- Backend running: `cd backend && npm run start:dev` (port 3001)
- Frontend running: `npm run dev` (port 3000)
- PostgreSQL running with the Prisma migration applied
- Browser: Chrome or Edge (for full notification action button support)

---

## Scenario 1: Set and Receive a Reminder (US1 — Core Flow)

1. Open `http://localhost:3000` in Chrome
2. Click the "+" FAB to open the Task modal
3. Enter title "Doctor appointment", category "Health", priority "High"
4. Set due date to tomorrow
5. Enable the reminder toggle
6. Set reminder time to **2 minutes from now**
7. Click "Add Task" — task card appears with a blue "Reminder set" badge
8. When the browser asks for notification permission, click "Allow"
9. Wait for the reminder time to arrive (within 60 seconds of polling)
10. ✅ Verify: Desktop notification appears with "Doctor appointment" and "Snooze 5 min" / "Dismiss" buttons
11. ✅ Verify: Alarm sound begins playing
12. ✅ Verify: Task card pulses with an amber/red highlighted border animation
13. ✅ Verify: An in-app banner appears at the top of the page with title and action buttons

---

## Scenario 2: Snooze a Reminder (US2)

1. Complete Scenario 1 steps through step 12 (reminder is actively alerting)
2. Click "Snooze 5 min" (either in the desktop notification or the in-app banner)
3. ✅ Verify: Alarm sound stops immediately
4. ✅ Verify: Task card pulse animation clears; card shows "Snoozed" badge in amber
5. ✅ Verify: In-app banner dismisses
6. **Refresh the page**
7. ✅ Verify: Task card still shows "Snoozed" badge (persisted in DB)
8. Wait 5 minutes
9. ✅ Verify: Reminder fires again with notification + sound + pulsing card

---

## Scenario 3: Dismiss a Reminder (US2)

1. Trigger an active reminder (Scenario 1)
2. Click "Dismiss" in the in-app banner
3. ✅ Verify: Alarm stops, pulse clears, card shows "Reminder dismissed" badge in gray
4. Refresh the page
5. ✅ Verify: Card still shows "Reminder dismissed" (persisted)
6. Wait 10 minutes
7. ✅ Verify: No reminder re-fires

---

## Scenario 4: Disable a Reminder Before It Triggers (US2)

1. Create a task with a reminder set 30 minutes in the future
2. ✅ Verify: Task card shows "Reminder set" blue badge
3. Click edit on the task
4. Toggle the reminder toggle to OFF
5. Save
6. ✅ Verify: Task card shows "No reminder" gray badge
7. Wait for the originally set time to pass
8. ✅ Verify: No notification fires, no alarm sounds

---

## Scenario 5: Complete a Task Cancels Its Reminder (US2)

1. Create a task with a reminder 30 minutes in the future
2. Click the task's completion checkbox to mark it done
3. ✅ Verify: Task is marked complete (strikethrough/muted)
4. Wait for the originally set reminder time
5. ✅ Verify: No reminder fires

---

## Scenario 6: Responsive Card Layout (US3)

1. Open DevTools → toggle device emulation
2. Set viewport to **375px wide** (iPhone)
3. ✅ Verify: Tasks display in a single-column grid with no horizontal scrollbar
4. Set viewport to **768px wide** (iPad)
5. ✅ Verify: Tasks display in a two-column grid
6. Set viewport to **1280px wide** (desktop)
7. ✅ Verify: Tasks display in a three or four-column grid
8. ✅ Verify: No horizontal overflow at any breakpoint
9. ✅ Verify: Each card shows: title, completion checkbox, due date (if set), reminder time + status badge, edit + delete buttons

---

## Scenario 7: Reminder Persists Across Page Refresh (US4)

1. Create a task with a reminder 10 minutes in the future
2. Note the reminder time shown on the card
3. **Hard-refresh** the page (Cmd+Shift+R / Ctrl+Shift+R)
4. ✅ Verify: Task card still shows the same reminder time and "Reminder set" badge
5. Wait for the reminder time
6. ✅ Verify: Reminder fires correctly even after refresh

---

## Scenario 8: No Duplicate Reminder on Refresh (US1 — Duplicate prevention)

1. Create a task with a reminder 1 minute in the future
2. Wait for the reminder to fire (notification + sound + pulse)
3. **Immediately refresh the page** (within the same minute)
4. ✅ Verify: Reminder does NOT fire a second time after the refresh

---

## Scenario 9: Fallback When Notification Permission Denied (US1)

1. In Chrome settings, deny notification permission for `localhost:3000`
2. Create a task with a reminder 2 minutes from now
3. Wait for the trigger time
4. ✅ Verify: No desktop notification appears (permission denied)
5. ✅ Verify: In-app banner alert appears prominently with snooze/dismiss buttons
6. ✅ Verify: Alarm sound plays, card pulses

---

## Scenario 10: 100+ Tasks Performance (US3)

1. Create or seed 100+ tasks in the database
2. Open `http://localhost:3000`
3. ✅ Verify: Page loads and card grid becomes interactive within 3 seconds
4. ✅ Verify: Scrolling is smooth with no visible jank
5. ✅ Verify: Existing task operations (create, edit, delete, filter, sort) work correctly

---

## Regression Checklist (SC-006)

After implementing the feature, verify all existing operations still work:

- [ ] Create task via FAB → appears in card grid
- [ ] Edit task via pencil icon → modal pre-fills, saves correctly
- [ ] Delete task → card removed
- [ ] Toggle completion → card updates (strikethrough, completed badge)
- [ ] Search filter → card grid filters in real time
- [ ] Category/priority filter chips → compose correctly
- [ ] Sort by due date / priority / created → reorders grid
- [ ] Drag-and-drop reorder (custom sort) → persists after refresh
- [ ] Dark mode toggle → all cards and reminder badges render correctly in dark theme
- [ ] Sidebar category nav → clicking category filters grid
- [ ] Progress bar → updates when tasks are completed
