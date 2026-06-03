# UI Component Contracts: Todo App

**Branch**: `001-todo-app` | **Date**: 2026-05-15 | **Constitution**: v3.0.0

All components declare `"use client"` as their first line. No component reads from or writes to `localStorage` directly. All styling uses Tailwind utility classes — no CSS files, no CSS-in-JS.

---

## `lib/storage.ts`

```typescript
export type Todo = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
};

export const STORAGE_KEY = "todo-app-tasks";

export function loadTodos(): Todo[];
export function saveTodos(todos: Todo[]): void;
```

---

## `app/page.tsx` (`"use client"`)

Owns all todo state. Renders `TodoInput` and `TodoList`.

**State**: `todos: Todo[]` (newest-first)

**Callbacks**:

- `handleAdd(text: string): void` — trims, rejects empty, prepends new Todo, persists
- `handleToggle(id: string): void` — flips `completed` on matching todo, persists
- `handleDelete(id: string): void` — removes todo with given id, persists

**Side effects**:

- On mount: `setTodos(loadTodos())`
- On `todos` change: `saveTodos(todos)`

---

## `app/components/TodoInput.tsx` (`"use client"`)

```typescript
type TodoInputProps = {
  onAdd: (text: string) => void;
};
```

**HTML structure**: `<form>` wrapping `<label>` + `<input type="text">` + `<button type="submit">Add</button>`

**Behaviour**:

- Manages local `value: string` state for the controlled input.
- `form.onSubmit` calls `onAdd(value.trim())` and clears the field.
- Does nothing if `value.trim()` is empty.
- Enter key and button click both trigger `onSubmit` (native `<form>` behaviour).

**Accessibility**:

- `<label>` associates with `<input>` via `htmlFor` / `id` — provides accessible name.
- Submit `<button>` text "Add" is the accessible label.

---

## `app/components/TodoList.tsx` (`"use client"`)

```typescript
type TodoListProps = {
  todos: Todo[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
};
```

**Behaviour**:

- `todos.length === 0`: renders an empty-state message.
- Otherwise: `<ul role="list">` containing one `<li>` per todo, each rendering `TodoItem`.

---

## `app/components/TodoItem.tsx` (`"use client"`)

```typescript
type TodoItemProps = {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
};
```

**HTML structure**: `<li>` containing toggle `<button>`, task `<span>`, delete `<button>`

**Behaviour**:

- Task text `<span>`: Tailwind `line-through` class applied when `todo.completed === true`.
- Toggle `<button>`:
  - `onClick={() => onToggle(todo.id)}`
  - `aria-label`: `"Mark '${todo.text}' as complete"` when active; `"Mark '${todo.text}' as incomplete"` when completed.
- Delete `<button>`:
  - `onClick={() => onDelete(todo.id)}`
  - `aria-label`: `"Delete task: ${todo.text}"`
- No local state.
