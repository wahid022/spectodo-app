# Quickstart: Enhanced Todo Dashboard

**Branch**: `003-enhanced-todo-dashboard` | **Date**: 2026-05-19

---

## Prerequisites

- Node.js 20 LTS
- PostgreSQL 16 running on port 5432 (Homebrew: `brew services start postgresql@16`)
- Existing `todo_app` database (from spec 002)

---

## Step 1: Install New Frontend Dependencies

```bash
# From repo root
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install framer-motion sonner next-themes tailwindcss-animate
```

## Step 2: Run the Database Migration

```bash
cd backend
npx prisma migrate dev --name add_task_fields
```

After the migration file is generated, open `backend/prisma/migrations/<timestamp>_add_task_fields/migration.sql` and **prepend** this line before the `ALTER TABLE` statements:

```sql
UPDATE "Task" SET "sortOrder" = CAST(ROW_NUMBER() OVER (ORDER BY "createdAt" ASC) AS INTEGER) - 1;
```

Then apply:

```bash
npx prisma migrate dev
```

Confirm: `npx prisma studio` → Task table should show new columns with values.

## Step 3: Start Both Servers

**Terminal 1 — Backend:**
```bash
cd backend && npm run start:dev
# Expected: NestJS listening on http://localhost:3001
```

**Terminal 2 — Frontend:**
```bash
npm run dev
# Expected: Next.js on http://localhost:3000
```

---

## Smoke Tests

### 1. Create a task with all fields

```bash
curl -s -X POST http://localhost:3001/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Buy groceries","category":"Personal","priority":"High","dueDate":"2026-06-01T00:00:00.000Z"}' \
  | python3 -m json.tool
```

Expected: 201 response with `category`, `priority`, `dueDate`, `sortOrder` fields present.

### 2. Edit a task

```bash
curl -s -X PATCH http://localhost:3001/tasks/<ID> \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated title","priority":"Urgent"}' \
  | python3 -m json.tool
```

Expected: 200 response with updated fields only; other fields unchanged.

### 3. Reorder tasks

```bash
curl -s -X PATCH http://localhost:3001/tasks/reorder \
  -H "Content-Type: application/json" \
  -d '{"tasks":[{"id":"<ID1>","sortOrder":0},{"id":"<ID2>","sortOrder":1}]}' \
  | python3 -m json.tool
```

Expected: `{ "updated": 2 }`.

### 4. Verify CORS

```bash
curl -s -I -H "Origin: http://localhost:3000" http://localhost:3001/tasks \
  | grep -i access-control
```

Expected: `Access-Control-Allow-Origin: http://localhost:3000`

---

## Manual Acceptance Checklist

Run through these in the browser at `http://localhost:3000`:

- [ ] Click the FAB (+) — modal opens with all fields (title, category, priority, due date)
- [ ] Create a task — appears in list with correct badge colors; "Task created" toast shows
- [ ] Edit a task — click edit icon; modal opens pre-filled; save updates list; "Task updated" toast
- [ ] Delete a task — disappears with animation; "Task deleted" toast; does not reappear on refresh
- [ ] Toggle completion — checkbox triggers loading spinner; completed task shows strikethrough
- [ ] Progress bar — reflects correct percentage; animates on toggle
- [ ] Search — type in search box; list filters in real time
- [ ] Filter by category — click category chip; list narrows
- [ ] Filter by priority — click priority chip; filters compose with category
- [ ] Sort by due date — list reorders; drag handle is hidden; tooltip explains
- [ ] Clear sort — custom drag order is restored
- [ ] Drag and drop — drag task by handle; new order persists on refresh
- [ ] Dark mode toggle — UI switches instantly, no white flash; preference survives refresh
- [ ] Mobile layout (375px) — sidebar hidden; FAB visible; all actions accessible
- [ ] Backend down — stop NestJS; load page; error banner + retry button appears
- [ ] Retry — start NestJS; click retry; tasks load; error clears

---

## Environment Variables Reference

### Backend (`backend/.env`)
```
DATABASE_URL=postgresql://md.rahman@localhost:5432/todo_app
FRONTEND_URL=http://localhost:3000
PORT=3001
```

### Frontend (`.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```
