# API Contract: Task CRUD Endpoints

**Branch**: `002-nestjs-postgres-backend` | **Date**: 2026-05-18
**Base URL**: `$NEXT_PUBLIC_API_URL` (e.g. `https://your-backend.up.railway.app`)
**Content-Type**: `application/json` for all requests and responses

---

## Common Response Types

### Task Object (success payload)

```json
{
  "id": "clxxxxxxxxxxxxxxx",
  "title": "Buy groceries",
  "completed": false,
  "createdAt": "2026-05-18T10:00:00.000Z",
  "updatedAt": "2026-05-18T10:00:00.000Z"
}
```

### Error Object (all 4xx / 5xx responses)

```json
{
  "statusCode": 400,
  "message": ["title should not be empty"],
  "error": "Bad Request"
}
```

Note: `message` is a string array for validation errors (class-validator) and a
plain string for single-error responses (e.g. 404 Not Found).

---

## POST /tasks — Create Task

Creates a new task with `completed: false` and a server-generated timestamp.

### Request

```
POST /tasks
Content-Type: application/json

{
  "title": "Buy groceries"
}
```

### Validation

| Rule | Error |
|------|-------|
| `title` is required | 400 `"title should not be empty"` |
| `title` must be a string | 400 `"title must be a string"` |
| `title` must be ≤ 255 characters | 400 `"title must be shorter than or equal to 255 characters"` |

### Responses

**201 Created** — task successfully created:
```json
{
  "id": "clxxxxxxxxxxxxxxx",
  "title": "Buy groceries",
  "completed": false,
  "createdAt": "2026-05-18T10:00:00.000Z",
  "updatedAt": "2026-05-18T10:00:00.000Z"
}
```

**400 Bad Request** — validation failed:
```json
{
  "statusCode": 400,
  "message": ["title should not be empty"],
  "error": "Bad Request"
}
```

---

## GET /tasks — Fetch All Tasks

Returns all tasks ordered by creation time, newest first. No pagination.

### Request

```
GET /tasks
```

### Responses

**200 OK** — array of Task objects (empty array if no tasks):
```json
[
  {
    "id": "clyyy",
    "title": "Second task",
    "completed": false,
    "createdAt": "2026-05-18T10:05:00.000Z",
    "updatedAt": "2026-05-18T10:05:00.000Z"
  },
  {
    "id": "clxxx",
    "title": "First task",
    "completed": true,
    "createdAt": "2026-05-18T10:00:00.000Z",
    "updatedAt": "2026-05-18T10:01:00.000Z"
  }
]
```

---

## PATCH /tasks/:id — Toggle Task Completion

Updates the `completed` field of a single task. Only `completed` is accepted;
all other fields are immutable after creation.

### Request

```
PATCH /tasks/:id
Content-Type: application/json

{
  "completed": true
}
```

### Validation

| Rule | Error |
|------|-------|
| `completed` is required | 400 `"completed must be a boolean value"` |
| `completed` must be a boolean | 400 `"completed must be a boolean value"` |
| `:id` does not match any task | 404 `"Task not found"` |

### Responses

**200 OK** — task updated, returns full updated entity:
```json
{
  "id": "clxxxxxxxxxxxxxxx",
  "title": "Buy groceries",
  "completed": true,
  "createdAt": "2026-05-18T10:00:00.000Z",
  "updatedAt": "2026-05-18T10:02:00.000Z"
}
```

**400 Bad Request** — invalid body:
```json
{
  "statusCode": 400,
  "message": ["completed must be a boolean value"],
  "error": "Bad Request"
}
```

**404 Not Found** — task does not exist:
```json
{
  "statusCode": 404,
  "message": "Task not found",
  "error": "Not Found"
}
```

---

## DELETE /tasks/:id — Delete Task

Permanently removes a task. No confirmation required. Returns the deleted entity.

### Request

```
DELETE /tasks/:id
```

### Validation

| Rule | Error |
|------|-------|
| `:id` does not match any task | 404 `"Task not found"` |

### Responses

**200 OK** — task deleted, returns the deleted entity:
```json
{
  "id": "clxxxxxxxxxxxxxxx",
  "title": "Buy groceries",
  "completed": false,
  "createdAt": "2026-05-18T10:00:00.000Z",
  "updatedAt": "2026-05-18T10:00:00.000Z"
}
```

**404 Not Found** — task does not exist:
```json
{
  "statusCode": 404,
  "message": "Task not found",
  "error": "Not Found"
}
```

---

## CORS Headers

The backend sets the following CORS header on all responses:

```
Access-Control-Allow-Origin: <value of FRONTEND_URL env var>
```

All origins other than the configured `FRONTEND_URL` are rejected with a CORS
preflight failure. The frontend must be deployed to the exact origin configured
in the backend's `FRONTEND_URL` environment variable.

---

## Environment Variables

### Backend (`backend/.env` / Railway environment)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Prisma PostgreSQL connection string | `postgresql://user:pass@host:5432/dbname` |
| `FRONTEND_URL` | Exact origin of the deployed frontend | `https://your-app.vercel.app` |
| `PORT` | Port for the NestJS server (Railway sets this automatically) | `3001` |

### Frontend (`app/.env.local` / deployment environment)

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Base URL of the deployed NestJS backend | `https://your-backend.up.railway.app` |
