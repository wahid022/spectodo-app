# Research: Smart Task Reminder System

## Decision 1: Browser Notification Action Buttons — Minimal Service Worker

**Decision**: Use a minimal Service Worker (`public/sw.js`) with `BroadcastChannel` for notification action buttons. Fall back to in-app banner for Firefox/Safari.

**Rationale**: `new Notification()` silently ignores the `actions` property on all browsers — service worker registration is required to show action buttons via `ServiceWorkerRegistration.showNotification()`. The minimal approach is two files (sw.js + client registration) with no third-party SW library.

**Implementation pattern**:
- `public/sw.js`: listens for `notificationclick`, posts `{ action, taskId }` to a `BroadcastChannel('task-reminders')` channel
- Page: registers SW once on load, listens to `BroadcastChannel` for action messages, calls the appropriate PATCH API
- Feature detection: `'actions' in Notification.prototype` — if false (Firefox desktop, Safari iOS), skip SW notification and use in-app banner only

**Browser support matrix**:
- Chrome/Edge desktop: Full notification actions ✅
- Firefox desktop: Notifications work, actions silently ignored → fall back to in-app banner
- Safari macOS 16+: Partial action support — in-app banner as safety net
- Safari iOS: Requires PWA install, actions ignored — in-app banner

**Alternatives considered**:
- `new Notification()` without SW: ruled out — actions are silently ignored
- In-app banner only: valid fallback, but fails when tab is not focused; misses FR-010 for Chrome/Edge
- Third-party push libraries: unnecessary complexity for a personal, single-user app

---

## Decision 2: Polling Strategy — setInterval + visibilitychange

**Decision**: 30-second `setInterval` in a custom `useReminderChecker` hook, combined with an immediate re-check on `visibilitychange` (tab becomes visible).

**Rationale**: Browsers throttle `setInterval` in background tabs to ≥1 minute after 5 minutes of backgrounding (Chrome). The `visibilitychange` handler catches up immediately when the user returns to the tab — preventing missed reminders after the browser throttled the timer. Web Workers are not used — they also get throttled in background tabs and add complexity without meaningful gain for a single-user app.

**Hook structure**:
```
useReminderChecker(tasks, onReminderDue):
  - setInterval(check, 30_000)
  - document.addEventListener('visibilitychange', () => { if visible: check() })
  - cleanup on unmount
  - check(): filter tasks where conditions met → call onReminderDue(task)
```

**Trigger conditions** (check per task):
- `reminderEnabled = true`
- `notificationTriggered = false`
- `reminderStatus ≠ 'dismissed'`
- If `reminderStatus = 'pending'`: `reminderTime <= now`
- If `reminderStatus = 'snoozed'`: `snoozeUntil <= now`

**Alternatives considered**:
- Server-Sent Events / WebSockets: unnecessary complexity; app is single-user, no real-time server push needed
- Web Workers: throttled similarly in background, adds complexity
- 5-second poll: too frequent, wastes resources; 60s tolerance in spec allows 30s interval safely

---

## Decision 3: Audio Playback — HTMLAudioElement with Unlock Pattern

**Decision**: `HTMLAudioElement` with `audio.loop = true`, MP3 format, stored at `public/sounds/reminder.mp3`. Implement an audio unlock on first user gesture. Auto-stop after 5 minutes via `setTimeout`.

**Rationale**: `HTMLAudioElement` is simpler than Web Audio API for looped alarm playback with a clean stop. Web Audio API's `AudioBufferSourceNode` doesn't support a simple `loop` + `stop` pattern without extra complexity.

**Autoplay restriction mitigation**: Browsers block `audio.play()` until the user has interacted with the page. Solution: on the first user interaction (any click), call `audio.play().then(() => audio.pause())` on a shared audio instance to "unlock" it. Subsequent timer-triggered plays will succeed.

**Implementation**:
```
reminderAudio.ts:
  - unlock(): play/pause a silent shared Audio instance on first user gesture
  - play(): audio.currentTime = 0; audio.loop = true; audio.play().catch(noop)
  - stop(): audio.pause(); audio.currentTime = 0
  - scheduleAutoStop(5 min): setTimeout(stop, 300_000)
```

**Format**: MP3 primary (universal), no OGG fallback needed — Next.js serves from `public/`, all modern browsers support MP3.

**Alternatives considered**:
- Web Audio API: overcomplicated for this use case
- OGG fallback: unnecessary given modern browser baseline assumption
- Streaming audio URL: requires external dependency; bundled file is simpler and works offline

---

## Decision 4: Drag-and-Drop Grid — rectSortingStrategy

**Decision**: Switch from `verticalListSortingStrategy` to `rectSortingStrategy` for the CSS grid layout. Keep `closestCenter` collision detection.

**Rationale**: `verticalListSortingStrategy` only computes Y-axis transforms and produces incorrect ordering in multi-column grids. `rectSortingStrategy` uses full bounding-rect math (X + Y) and is the correct strategy for grid layouts. `closestCenter` is explicitly recommended for grids by the dnd-kit docs over `rectIntersection`.

**Required code changes**:
- `DraggableTaskList.tsx`: `strategy={verticalListSortingStrategy}` → `strategy={rectSortingStrategy}`
- Grid container: `flex flex-col gap-2` → `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4`
- `DragOverlay`: no changes needed — same pattern works for grid

**Alternatives considered**:
- Keep vertical list for DnD, separate grid for non-draggable views: too complex, two layout modes
- Disable DnD in grid mode: acceptable fallback if rect strategy has issues, but not needed

---

## Decision 5: Snooze Persistence — DB Field snoozeUntil

**Decision**: Add `snoozeUntil: DateTime?` field to the Task model in the database. When user snoozes, PATCH sets `reminderStatus='snoozed'`, `snoozeUntil=now+5min`, `notificationTriggered=false`.

**Rationale**: The spec requires "snoozed reminder with 3 minutes remaining survives page refresh" (US4 scenario 3). The only way to survive a refresh is DB persistence. `snoozeUntil` is the authoritative next-trigger timestamp, calculated server-side to avoid clock skew.

**Alternatives considered**:
- `localStorage` for snooze expiry: ruled out by constitution Principle I (localStorage prohibited for task data)
- In-memory only: fails on refresh — violates US4 acceptance criteria
- Re-use `reminderTime` field for snooze (overwrite): loses the original reminder time; user can't un-snooze to the original time

---

## Decision 6: Reminder State Machine — 5-State String Enum

**Decision**: `reminderStatus: String @default("none")` with values: `none`, `pending`, `snoozed`, `dismissed`. `notificationTriggered: Boolean` as a separate flag.

**Rationale**: Separating "has notification fired" (`notificationTriggered`) from "what is the user's intent" (`reminderStatus`) keeps the state machine clean and prevents conflation. `notificationTriggered` is reset to `false` on snooze so the reminder re-fires.

**State transitions**:
```
none → pending (user enables reminder + sets time)
pending → triggered (poller detects time passed; fires notification; sets notificationTriggered=true)
triggered → snoozed (user clicks snooze; snoozeUntil=now+5min; notificationTriggered=false)
triggered → dismissed (user clicks dismiss; notificationTriggered=true stays true)
snoozed → triggered (poller detects snoozeUntil passed; fires again; notificationTriggered=true)
snoozed → dismissed (user dismisses from snoozed state)
any → none (user disables reminderEnabled toggle)
```

Note: `triggered` is a client-side transient state only (the card is actively alerting). It is not stored in DB — the DB stores `pending`/`snoozed`/`dismissed`. The UI derives "triggered" from: `notificationTriggered=true && reminderStatus='pending'` (or from the `snoozeUntil` having passed). Actually to keep it simpler, `triggered` is just the frontend's in-memory alert state tracked in React state, not in the DB enum.

**DB enum values**: `none`, `pending`, `snoozed`, `dismissed` — stored as strings, validated by `@IsIn` decorator in NestJS DTOs.
