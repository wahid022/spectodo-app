# API Contracts: Enhanced Todo Dashboard

**Branch**: `003-enhanced-todo-dashboard` | **Date**: 2026-05-19
**Base URL**: `http://localhost:3001` (dev) | env var: `NEXT_PUBLIC_API_URL`

---

## Common Response Shape

All endpoints return the full Task object on success:

```json
{
  "id": "cmpxxxxx",
  "title": "Buy groceries",
  "completed": false,
  "category": "Personal",
  "priority": "High",
  "dueDate": "2026-05-25T00:00:00.000Z",
  "sortOrder": 3,
  "createdAt": "2026-05-19T10:00:00.000Z",
  "updatedAt": "2026-05-19T10:00:00.000Z"
}
```

All error responses follow:
```json
{ "statusCode": 400, "message": ["title must not be empty"], "error": "Bad Request" }
```

---

## Endpoints

### GET /tasks

Fetch all tasks, ordered by `sortOrder ASC`.

**Request**: No body, no query params.

**Response 200**:
```json
[
  { "id": "...", "title": "...", "completed": false, "category": "Work", "priority": "High", "dueDate": null, "sortOrder": 0, "createdAt": "...", "updatedAt": "..." },
  { "id": "...", "title": "...", "completed": true, "category": "Personal", "priority": "Low", "dueDate": "2026-05-25T00:00:00.000Z", "sortOrder": 1, "createdAt": "...", "updatedAt": "..." }
]
```

**Notes**: Returns empty array `[]` when no tasks exist. Frontend applies all sorting/filtering client-side on top of this response.

---

### POST /tasks

Create a new task.

**Request body**:
```json
{
  "title": "Buy groceries",
  "category": "Personal",
  "priority": "High",
  "dueDate": "2026-05-25T00:00:00.000Z"
}
```

| Field | Required | Validation |
|---|---|---|
| `title` | Yes | Non-empty string, max 255 chars |
| `category` | Yes | One of: `Work`, `Personal`, `Health`, `Finance`, `Learning` |
| `priority` | Yes | One of: `Low`, `Medium`, `High`, `Urgent` |
| `dueDate` | No | ISO 8601 date string or `null` |

**Response 201**: Full Task object with `sortOrder` assigned by backend.

**Error 400**: Validation failure — returns array of field-level messages.

---

### PATCH /tasks/:id

Update any combination of task fields (full edit support, including toggle).

**Request body** (all fields optional — send only what changed):
```json
{
  "title": "Updated title",
  "category": "Work",
  "priority": "Urgent",
  "dueDate": "2026-06-01T00:00:00.000Z",
  "completed": true
}
```

| Field | Validation |
|---|---|
| `title` | Non-empty string, max 255 chars |
| `category` | One of 5 valid values |
| `priority` | One of 4 valid values |
| `dueDate` | ISO 8601 string or `null` |
| `completed` | Boolean |

**Response 200**: Updated Task object.

**Error 400**: Validation failure.
**Error 404**: `{ "statusCode": 404, "message": "Task not found" }` — task ID does not exist.

---

### DELETE /tasks/:id

Permanently delete a task.

**Request**: No body.

**Response 200**: The deleted Task object (for client-side state removal).

**Error 404**: Task not found.

---

### PATCH /tasks/reorder

Batch-update `sortOrder` for drag-and-drop persistence.

**Request body**:
```json
{
  "tasks": [
    { "id": "cmpxxx1", "sortOrder": 0 },
    { "id": "cmpxxx2", "sortOrder": 1 },
    { "id": "cmpxxx3", "sortOrder": 2 }
  ]
}
```

| Field | Required | Validation |
|---|---|---|
| `tasks` | Yes | Non-empty array |
| `tasks[].id` | Yes | String |
| `tasks[].sortOrder` | Yes | Non-negative integer |

**Response 200**:
```json
{ "updated": 3 }
```

**Error 400**: Empty array or invalid shape.
**Error 404**: Any task ID in the array not found.

**Notes**: This endpoint runs all updates in a single Prisma transaction. Called only after a drag-and-drop operation completes (on drop, not on drag). Route must be registered **before** `PATCH /tasks/:id` in NestJS controller to avoid `:id` matching the literal string `reorder`.

---

## DTO Summary (Backend)

### CreateTaskDto
```typescript
export class CreateTaskDto {
  @IsString() @IsNotEmpty() @MaxLength(255)
  title: string;

  @IsString() @IsIn(['Work', 'Personal', 'Health', 'Finance', 'Learning'])
  category: string;

  @IsString() @IsIn(['Low', 'Medium', 'High', 'Urgent'])
  priority: string;

  @IsOptional() @IsISO8601()
  dueDate?: string;
}
```

### UpdateTaskDto
```typescript
export class UpdateTaskDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(255)
  title?: string;

  @IsOptional() @IsString() @IsIn(['Work', 'Personal', 'Health', 'Finance', 'Learning'])
  category?: string;

  @IsOptional() @IsString() @IsIn(['Low', 'Medium', 'High', 'Urgent'])
  priority?: string;

  @IsOptional() @IsISO8601()
  dueDate?: string | null;

  @IsOptional() @IsBoolean()
  completed?: boolean;
}
```

### ReorderTasksDto
```typescript
export class ReorderItemDto {
  @IsString() @IsNotEmpty()
  id: string;

  @IsInt() @Min(0)
  sortOrder: number;
}

export class ReorderTasksDto {
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => ReorderItemDto)
  tasks: ReorderItemDto[];
}
```
