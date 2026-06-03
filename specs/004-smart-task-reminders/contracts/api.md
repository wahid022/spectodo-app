# API Contracts: Smart Task Reminder System

## Overview

All reminder operations extend the **existing** PATCH `/tasks/:id` endpoint via additive fields in `UpdateTaskDto`. No new endpoints are introduced. The existing 5 endpoints (GET /tasks, POST /tasks, PATCH /tasks/reorder, PATCH /tasks/:id, DELETE /tasks/:id) are unchanged in structure.

---

## Updated: GET /tasks

**Response**: Array of Task objects, now including reminder fields.

```json
[
  {
    "id": "cuid123",
    "title": "Buy groceries",
    "completed": false,
    "category": "Personal",
    "priority": "High",
    "dueDate": "2026-05-20T00:00:00.000Z",
    "sortOrder": 0,
    "createdAt": "2026-05-19T10:00:00.000Z",
    "updatedAt": "2026-05-19T10:00:00.000Z",
    "reminderTime": "2026-05-20T09:00:00.000Z",
    "reminderEnabled": true,
    "reminderStatus": "pending",
    "notificationTriggered": false,
    "snoozeUntil": null
  }
]
```

---

## Updated: POST /tasks

**Request body** (new optional reminder fields added):

```json
{
  "title": "Doctor appointment",
  "category": "Health",
  "priority": "High",
  "dueDate": "2026-05-21T00:00:00.000Z",
  "reminderTime": "2026-05-21T08:30:00.000Z",
  "reminderEnabled": true
}
```

**DTO additions to `CreateTaskDto`**:

```typescript
@IsOptional()
@IsISO8601()
reminderTime?: string;

@IsOptional()
@IsBoolean()
reminderEnabled?: boolean;
```

**Defaults applied by backend**:
- `reminderStatus = "pending"` (when `reminderEnabled=true` and `reminderTime` is set) or `"none"` otherwise
- `notificationTriggered = false`
- `snoozeUntil = null`

**Response**: Full Task object with all reminder fields.

**Validation**:
- If `reminderTime` is in the past, backend responds with `200` but includes `warning: "Reminder time is in the past"` in the response body
- If `reminderEnabled = true` but `reminderTime` is missing, backend responds `400 Bad Request`

---

## Updated: PATCH /tasks/:id

All existing update fields remain. New reminder fields are added as optional.

### Sub-operation: Mark Notification Triggered (frontend calls when poller fires)

**Request**:
```json
{
  "notificationTriggered": true
}
```
**Effect**: Marks the reminder as having fired; prevents duplicate triggers on refresh.

---

### Sub-operation: Snooze Active Reminder

**Request** (frontend sends when user clicks Snooze):
```json
{
  "reminderStatus": "snoozed",
  "notificationTriggered": false
}
```
**Backend computes and sets**: `snoozeUntil = now + 5 minutes` when `reminderStatus = "snoozed"` is received and `snoozeUntil` is not provided by the client.

**Response**: Updated task with `snoozeUntil` populated.

---

### Sub-operation: Dismiss Reminder

**Request**:
```json
{
  "reminderStatus": "dismissed",
  "notificationTriggered": true
}
```
**Effect**: No further triggers. `snoozeUntil` is cleared to null by backend.

---

### Sub-operation: Disable Reminder Before Trigger

**Request**:
```json
{
  "reminderEnabled": false
}
```
**Backend side-effects**: Sets `reminderStatus = "none"`, `notificationTriggered = false`, `snoozeUntil = null`.

---

### Sub-operation: Re-enable Reminder

**Request**:
```json
{
  "reminderEnabled": true,
  "reminderTime": "2026-05-21T10:00:00.000Z",
  "reminderStatus": "pending",
  "notificationTriggered": false
}
```

---

### Full DTO additions to `UpdateTaskDto`

```typescript
@IsOptional()
@IsISO8601()
reminderTime?: string | null;

@IsOptional()
@IsBoolean()
reminderEnabled?: boolean;

@IsOptional()
@IsString()
@IsIn(["none", "pending", "snoozed", "dismissed"])
reminderStatus?: string;

@IsOptional()
@IsBoolean()
notificationTriggered?: boolean;
```

**Note**: `snoozeUntil` is never accepted from the frontend — it is computed server-side when `reminderStatus = "snoozed"` is received.

---

## Backend Side-Effects on PATCH /tasks/:id

The backend MUST apply these side-effects automatically:

| Incoming field | Condition | Side-effect |
|---|---|---|
| `completed = true` | always | `reminderEnabled = false`, `reminderStatus = "none"`, `snoozeUntil = null` |
| `reminderStatus = "snoozed"` | always | `snoozeUntil = now + 5 min`, `notificationTriggered = false` |
| `reminderStatus = "dismissed"` | always | `snoozeUntil = null` |
| `reminderEnabled = false` | always | `reminderStatus = "none"`, `notificationTriggered = false`, `snoozeUntil = null` |
| `reminderEnabled = true` + `reminderTime` set | `reminderStatus` not provided | `reminderStatus = "pending"` |

---

## HTTP Status Codes

| Scenario | Code |
|---|---|
| Success | 200 |
| Task not found | 404 `{ "message": "Task not found" }` |
| Validation error | 400 `{ "message": ["field error 1", "..."] }` |
| Past reminder time | 200 + `"warning"` field in response |
| Invalid reminderStatus value | 400 `{ "message": "reminderStatus must be one of: none, pending, snoozed, dismissed" }` |

---

## Frontend API Client Extensions (lib/api.ts)

```typescript
export type Task = {
  // ... existing fields ...
  reminderTime: string | null;
  reminderEnabled: boolean;
  reminderStatus: "none" | "pending" | "snoozed" | "dismissed";
  notificationTriggered: boolean;
  snoozeUntil: string | null;
};

export type UpdateReminderPayload = {
  reminderTime?: string | null;
  reminderEnabled?: boolean;
  reminderStatus?: "none" | "pending" | "snoozed" | "dismissed";
  notificationTriggered?: boolean;
};

// Convenience wrappers
export function markReminderTriggered(id: string): Promise<Task> {
  return editTask(id, { notificationTriggered: true });
}

export function snoozeReminder(id: string): Promise<Task> {
  return editTask(id, { reminderStatus: "snoozed", notificationTriggered: false });
}

export function dismissReminder(id: string): Promise<Task> {
  return editTask(id, { reminderStatus: "dismissed", notificationTriggered: true });
}
```
