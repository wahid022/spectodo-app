# Data Model: Smart Task Reminder System

## Updated Entity: Task

Extends the existing Task entity with 5 new reminder-related fields. All existing fields are unchanged.

### Prisma Schema (additive migration)

```prisma
model Task {
  // ── Existing fields (unchanged) ─────────────────────────────────────────
  id          String    @id @default(cuid())
  title       String    @db.VarChar(255)
  completed   Boolean   @default(false)
  category    String    @default("Personal")
  priority    String    @default("Medium")
  dueDate     DateTime?
  sortOrder   Int       @default(0)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  // ── New reminder fields ──────────────────────────────────────────────────
  reminderTime          DateTime?
  reminderEnabled       Boolean   @default(false)
  reminderStatus        String    @default("none")
  notificationTriggered Boolean   @default(false)
  snoozeUntil           DateTime?
}
```

### New Field Definitions

| Field | Type | Default | Description |
|---|---|---|---|
| `reminderTime` | `DateTime?` | null | The exact date+time when the reminder should first fire |
| `reminderEnabled` | `Boolean` | false | Master toggle; when false, poller ignores this task entirely |
| `reminderStatus` | `String` | "none" | State machine value (see below) |
| `notificationTriggered` | `Boolean` | false | Whether the current reminder has already fired; prevents duplicates; reset on snooze |
| `snoozeUntil` | `DateTime?` | null | When snoozed, the next trigger time (now + 5 min); null otherwise |

### reminderStatus State Machine

```
┌─────────┐   enable + set time    ┌─────────┐
│  none   │ ──────────────────────▶│ pending │
└─────────┘                        └────┬────┘
     ▲                                  │ poller: reminderTime ≤ now
     │ disable                          ▼
     │                         [client: alerting]
     │                         PATCH: notificationTriggered=true
     │                                  │
     │              snooze              │              dismiss
     │         ┌────────────────────────┤
     │         ▼                        ▼
     │    ┌─────────┐             ┌───────────┐
     │    │ snoozed │             │ dismissed │
     │    └────┬────┘             └───────────┘
     │         │ poller: snoozeUntil ≤ now
     │         │ → fire again, set notificationTriggered=true
     │         │ → user dismisses from re-triggered state
     │         ▼
     │    [client: alerting again]
     │         │ dismiss
     │         ▼
     │    ┌───────────┐
     └────│ dismissed │
          └───────────┘

Any state → none: user toggles reminderEnabled = false
```

**Valid values**: `"none"` | `"pending"` | `"snoozed"` | `"dismissed"`

### Validation Rules

- `reminderTime` MUST be in the future at the time of save (backend warning, not hard block)
- `reminderStatus` MUST be one of the 4 valid enum strings — enforced by `@IsIn` NestJS validator
- `snoozeUntil` is set server-side by the backend when processing a snooze PATCH — never sent raw from frontend
- `notificationTriggered` MUST be reset to `false` when `reminderStatus` transitions to `snoozed`
- When `completed = true`, the backend MUST also set `reminderEnabled = false`

### Migration Strategy

Single additive migration — all new fields have defaults, so existing rows get safe values with no manual backfill required:

```sql
ALTER TABLE "Task"
  ADD COLUMN "reminderTime"          TIMESTAMP(3),
  ADD COLUMN "reminderEnabled"       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "reminderStatus"        TEXT NOT NULL DEFAULT 'none',
  ADD COLUMN "notificationTriggered" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "snoozeUntil"           TIMESTAMP(3);
```

---

## Frontend-Only Types

These types represent transient client-side state and are not stored in the database.

```typescript
// lib/types.ts additions

export type ReminderStatus = "none" | "pending" | "snoozed" | "dismissed";

// Transient alert state — lives in React state only
export type ActiveAlert = {
  taskId: string;
  taskTitle: string;
  firedAt: number;         // timestamp of when alert was triggered (for auto-stop)
  isSnoozeAllowed: boolean; // false if already snoozed once
};
```

---

## UI State Constants

```typescript
// lib/constants.ts additions

export const REMINDER_STATUS_LABELS: Record<ReminderStatus, string> = {
  none: "No reminder",
  pending: "Reminder set",
  snoozed: "Snoozed",
  dismissed: "Reminder dismissed",
};

export const REMINDER_STATUS_COLORS: Record<ReminderStatus, string> = {
  none: "text-gray-400",
  pending: "text-blue-500 dark:text-blue-400",
  snoozed: "text-amber-500 dark:text-amber-400",
  dismissed: "text-gray-400 line-through",
};

export const SNOOZE_DURATION_MS = 5 * 60 * 1000;  // 5 minutes
export const ALARM_AUTO_STOP_MS = 5 * 60 * 1000;  // 5 minutes
export const REMINDER_POLL_INTERVAL_MS = 30 * 1000; // 30 seconds
```
