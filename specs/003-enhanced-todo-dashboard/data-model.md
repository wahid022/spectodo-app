# Data Model: Enhanced Todo Dashboard

**Branch**: `003-enhanced-todo-dashboard` | **Date**: 2026-05-19

---

## Entity: Task

The single persisted entity. All new fields are additive to the existing schema.

### Prisma Schema (updated)

```prisma
model Task {
  id        String    @id @default(cuid())
  title     String    @db.VarChar(255)
  completed Boolean   @default(false)
  category  String    @default("Personal")
  priority  String    @default("Medium")
  dueDate   DateTime?
  sortOrder Int       @default(0)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}
```

### Field Definitions

| Field | Type | Required | Default | Constraints |
|---|---|---|---|---|
| `id` | String (cuid) | Yes | auto | Unique, immutable |
| `title` | String | Yes | — | 1–255 chars, non-whitespace |
| `completed` | Boolean | Yes | `false` | — |
| `category` | String | Yes | `"Personal"` | One of: `Work`, `Personal`, `Health`, `Finance`, `Learning` |
| `priority` | String | Yes | `"Medium"` | One of: `Low`, `Medium`, `High`, `Urgent` |
| `dueDate` | DateTime | No | `null` | ISO 8601 UTC; may be past |
| `sortOrder` | Int | Yes | `0` | Non-negative; unique per user (enforced in app logic, not DB) |
| `createdAt` | DateTime | Yes | `now()` | Immutable |
| `updatedAt` | DateTime | Yes | auto | Updated by Prisma on every write |

### Validation Rules

- `title`: trimmed before save; rejected if empty after trim; max 255 chars enforced by `@db.VarChar(255)`
- `category`: must match one of the 5 enum strings exactly; validated in DTO
- `priority`: must match one of the 4 enum strings exactly; validated in DTO
- `dueDate`: optional; stored as UTC; frontend converts local input to UTC before sending
- `sortOrder`: assigned by the backend on creation (max existing sortOrder + 1, or 0 if first task); updated in batch by reorder endpoint

---

## Client-Side Entities (no DB persistence)

### FilterState

Represents the active UI filter combination. Lives in React state only — never sent to the backend.

```typescript
type FilterState = {
  search: string;            // free text, applied client-side
  status: "all" | "active" | "completed";
  categories: string[];      // [] means all categories
  priorities: string[];      // [] means all priorities
  sortBy: "custom" | "dueDate" | "priority" | "createdAt";
};
```

### ThemePreference

Stored in `localStorage` by `next-themes`. Not sent to the backend.

```typescript
type Theme = "light" | "dark" | "system";
```

---

## Category Enum (frontend constant)

```typescript
export const CATEGORIES = ["Work", "Personal", "Health", "Finance", "Learning"] as const;
export type Category = typeof CATEGORIES[number];

export const CATEGORY_COLORS: Record<Category, string> = {
  Work:     "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Personal: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  Health:   "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  Finance:  "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  Learning: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};
```

---

## Priority Enum (frontend constant)

```typescript
export const PRIORITIES = ["Low", "Medium", "High", "Urgent"] as const;
export type Priority = typeof PRIORITIES[number];

export const PRIORITY_COLORS: Record<Priority, string> = {
  Low:    "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  Medium: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  High:   "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  Urgent: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

export const PRIORITY_SORT_WEIGHT: Record<Priority, number> = {
  Urgent: 4, High: 3, Medium: 2, Low: 1,
};
```

---

## Migration Plan

### Migration: `add_task_fields`

Adds `category`, `priority`, `dueDate`, `sortOrder` to the existing `Task` table.

**Safe for existing data**: All new non-nullable fields have defaults; existing rows are backfilled automatically by PostgreSQL.

**Custom SQL** (prepended to generated migration):
```sql
-- Assign unique sortOrder to existing rows based on creation order
UPDATE "Task"
SET "sortOrder" = CAST(ROW_NUMBER() OVER (ORDER BY "createdAt" ASC) AS INTEGER) - 1;
```

**Full migration steps**:
1. Update `backend/prisma/schema.prisma`
2. Run `cd backend && npx prisma migrate dev --name add_task_fields`
3. Edit the generated migration file to add the UPDATE statement before the ALTER TABLE
4. Run `npx prisma migrate dev` again to apply

---

## sortOrder Assignment Logic

- **On create**: `sortOrder = (SELECT COALESCE(MAX("sortOrder"), -1) + 1 FROM "Task")` — backend assigns next available value
- **On reorder**: `PATCH /tasks/reorder` receives an ordered array of `{ id, sortOrder }` pairs and updates all in a Prisma transaction
- **On delete**: sortOrder values are not compacted — gaps are acceptable; frontend sorts by `sortOrder ASC`
- **Applied sort (due date / priority / created)**: client-side array sort only; `sortOrder` in DB is not touched
