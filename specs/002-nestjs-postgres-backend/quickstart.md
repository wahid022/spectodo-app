# Quickstart: Backend-Powered Todo App

**Branch**: `002-nestjs-postgres-backend` | **Date**: 2026-05-18

This guide gets the full-stack app running locally and validates each constitution
quality gate before deployment.

## Prerequisites

- Node.js 20 LTS (`node --version` → `v20.x.x`)
- PostgreSQL 16 running locally (or a Railway/Render PostgreSQL URL)
- npm 10+

---

## 1. Backend Setup

```bash
# From repo root
cd backend
npm install

# Copy environment template and fill in your local DB URL
cp .env.example .env
# Edit .env: set DATABASE_URL and FRONTEND_URL

# Run database migrations (creates the Task table)
npx prisma migrate dev --name init

# Start the NestJS server (port 3001 by default)
npm run start:dev
```

Verify: `curl http://localhost:3001/tasks` should return `[]`.

---

## 2. Frontend Setup

```bash
# From repo root (in a separate terminal)
cp .env.local.example .env.local
# Edit .env.local: set NEXT_PUBLIC_API_URL=http://localhost:3001

npm install   # already installed if you ran this before
npm run dev   # starts Next.js on http://localhost:3000
```

Open `http://localhost:3000` — you should see the loading indicator briefly, then
an empty task list.

---

## 3. Smoke Test (Manual)

Run through all four user stories before committing:

| Action | Expected Result |
|--------|----------------|
| Open app | Loading indicator appears, then empty-state or task list |
| Add "Buy groceries" | Task appears at top of list instantly |
| Add "Walk the dog" | Appears above "Buy groceries" |
| Refresh browser | Both tasks present in same order |
| Click complete on "Buy groceries" | Strikethrough appears; position unchanged |
| Refresh browser | "Buy groceries" still shows as complete |
| Delete "Walk the dog" | Disappears immediately; no confirmation |
| Refresh browser | "Walk the dog" does not reappear |
| Stop the backend (`Ctrl+C`) and refresh | Error message + retry button appear within 3s |
| Restart backend, click retry | Tasks load; error dismissed |

---

## 4. Constitution Quality Gates

### Gate 1 — Build

```bash
# Backend
cd backend && npm run build    # must exit 0 with no TypeScript errors

# Frontend
cd .. && npm run build         # must exit 0 with no TypeScript errors
```

### Gate 2 — Migrations

```bash
cd backend
# Drop and recreate local DB, then migrate from scratch
dropdb todo_app_test && createdb todo_app_test
DATABASE_URL=postgresql://localhost/todo_app_test npx prisma migrate deploy
# Must complete without errors
```

### Gate 3 — API Endpoints

```bash
# Create a task
curl -s -X POST http://localhost:3001/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Test task"}' | jq .

# Fetch all tasks (should include task above, newest first)
curl -s http://localhost:3001/tasks | jq .

# Toggle complete (replace <ID> with actual id from above)
curl -s -X PATCH http://localhost:3001/tasks/<ID> \
  -H "Content-Type: application/json" \
  -d '{"completed":true}' | jq .

# Delete the task
curl -s -X DELETE http://localhost:3001/tasks/<ID> | jq .

# Confirm empty list
curl -s http://localhost:3001/tasks | jq .

# Validation — empty title should return 400
curl -s -X POST http://localhost:3001/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":""}' | jq .
```

### Gate 4 — Persistence

1. Add a task via the UI.
2. Fully close the browser tab.
3. Open `http://localhost:3000` in a new tab.
4. Confirm the task is present — data came from PostgreSQL, not localStorage.

---

## 5. Deployment Checklist (Railway)

### Backend

1. Push the `backend/` directory as a separate Railway service.
2. Add the Railway PostgreSQL plugin — `DATABASE_URL` is auto-injected.
3. Set `FRONTEND_URL` to your deployed frontend URL (e.g. `https://your-app.vercel.app`).
4. Set the **Release Command** to:
   ```
   npx prisma migrate deploy && node dist/main.js
   ```
5. Set the **Build Command** to:
   ```
   npm install && npm run build
   ```

### Frontend

1. Deploy the repo root as a Next.js service (Vercel / Railway / Render).
2. Set `NEXT_PUBLIC_API_URL` to the Railway backend URL
   (e.g. `https://your-backend.up.railway.app`).

### Validate after deployment

- Open the deployed frontend URL and run the smoke test above against production.
- Confirm tasks persist across browser refreshes on the live URL.
- Confirm `localStorage` is NOT used (open DevTools → Application → Local Storage
  — the task list must be empty there).

---

## Environment Variable Reference

See [contracts/api.md](contracts/api.md#environment-variables) for the full list
of required variables for both services.
