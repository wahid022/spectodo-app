# Data Model: Todo App

**Branch**: `001-todo-app` | **Date**: 2026-05-15

## Entity: Todo

```typescript
type Todo = {
  id: string;          // crypto.randomUUID() — unique, collision-safe
  text: string;        // Non-empty, trimmed task description
  completed: boolean;  // false = active, true = done
  createdAt: string;   // ISO 8601 timestamp — new Date().toISOString()
};
```

### Field Rules

| Field | Type | Constraints |
| ----- | ---- | ----------- |
| `id` | `string` | `crypto.randomUUID()`. Immutable after creation. |
| `text` | `string` | Non-empty after `trim()`. Stored as-is after trim. |
| `completed` | `boolean` | Defaults to `false`. Toggled by user action only. |
| `createdAt` | `string` | ISO 8601. Set once at creation. Immutable. |

### State Transitions

```text
[Create] → { completed: false }
    │
    ▼
[Toggle] ↔ { completed: true }
    │
    ▼
[Delete] → removed from list
```

---

## Storage

```typescript
const STORAGE_KEY = "todo-app-tasks";   // defined once in lib/storage.ts

function loadTodos(): Todo[]      // [] if missing, unavailable, or JSON invalid
function saveTodos(todos: Todo[]): void  // silently ignores storage errors
```

Data is stored as a JSON array at `STORAGE_KEY`. The array is always newest-first (index 0 = newest).

---

## In-Memory State

```typescript
const [todos, setTodos] = useState<Todo[]>([]);
```

- Hydrated from `loadTodos()` on mount.
- Persisted via `saveTodos(todos)` on every change.
- Always newest-first: new items prepended with `[newTodo, ...prev]`.
