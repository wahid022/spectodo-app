# Research: Enhanced Todo Dashboard

**Branch**: `003-enhanced-todo-dashboard` | **Date**: 2026-05-19

---

## Decision 1: Drag-and-Drop Library

**Decision**: `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities`

**Rationale**: `@dnd-kit` is the current industry standard (2.8M weekly downloads), actively maintained, and TypeScript-native. `react-beautiful-dnd` is deprecated by Atlassian. `@dnd-kit` supports React 18 concurrent features, built-in ARIA keyboard accessibility, and a modular 6KB core bundle. The `@dnd-kit/sortable` addon provides drag handles and automatic row animations with simple backend-persist hooks — exactly the use case required.

**Alternatives considered**:
- `react-beautiful-dnd` — rejected: deprecated, no longer maintained
- `pragmatic-drag-and-drop` (Atlassian) — rejected: larger API surface, less Next.js community usage

---

## Decision 2: Animation

**Decision**: `tailwindcss-animate` for list item transitions + `framer-motion` for modal and FAB animations

**Rationale**: Use both together. `tailwindcss-animate` provides lightweight CSS-only slide-in/fade-out utilities (zero JS cost) for task row enter/exit animations in server-rendered contexts. `framer-motion` handles richer client-side interactions: modal open/close, FAB pulse, `AnimatePresence` for unmounting animations. This avoids loading the full framer-motion bundle for simple list transitions while retaining its power for complex UI moments.

**Alternatives considered**:
- `framer-motion` only — rejected: unnecessary JS for simple CSS-achievable effects
- CSS transitions only — rejected: `AnimatePresence` for unmount animations is not achievable with plain CSS

---

## Decision 3: Toast Notifications

**Decision**: `sonner`

**Rationale**: Sonner has 47.2M weekly downloads (10× more than react-hot-toast), is the official shadcn/ui toast library, TypeScript-first, and has built-in dark mode support that automatically follows the active theme. Its global observer pattern keeps toasts alive across Next.js route changes. Setup is a single `<Toaster />` component in the root layout.

**Alternatives considered**:
- `react-hot-toast` — solid but lower ecosystem momentum, no built-in dark mode sync
- `react-toastify` — heavier API, more configuration overhead

---

## Decision 4: Dark Mode

**Decision**: `next-themes` with Tailwind `class` strategy

**Rationale**: `next-themes` injects a blocking script into `<head>` that reads the stored theme preference before the page renders, eliminating flash-of-unstyled-content (FOUC). Integration requires only `ThemeProvider` in the root layout (`attribute="class"`, `defaultTheme="system"`) and `suppressHydrationWarning` on `<html>`. Works seamlessly with Tailwind's dark mode class strategy — no cookie parsing, no SSR hacks, no hydration warnings.

**Alternatives considered**:
- Manual CSS variables — rejected: requires cookie-based SSR reading or hydration workarounds
- Tailwind `media` strategy — rejected: does not support user-controlled toggle; FOUC risk on system theme change

---

## Decision 5: Prisma Migration Strategy

**Decision**: Additive migration with custom `UPDATE` for `sortOrder`

**Rationale**: Adding columns with `@default` values to PostgreSQL is atomic and safe — Prisma generates `ALTER TABLE ... ADD COLUMN ... DEFAULT 'value'` which PostgreSQL applies in a single transaction, backfilling all existing rows. A custom SQL statement in the generated migration file assigns unique `sortOrder` values to existing rows based on `createdAt` order, preventing duplicates.

**Schema changes** (new fields on Task):
```prisma
category  String   @default("Personal")
priority  String   @default("Medium")
dueDate   DateTime?
sortOrder Int      @default(0)
```

**Migration approach**:
1. Update `schema.prisma`
2. Run `npx prisma migrate dev --name add_task_fields` inside `backend/`
3. Edit the generated migration SQL to prepend:
   ```sql
   UPDATE "Task" SET "sortOrder" = CAST(ROW_NUMBER() OVER (ORDER BY "createdAt" ASC) AS INTEGER) - 1;
   ```
4. Re-run migration to apply

**Alternatives considered**:
- Prisma enum for category/priority — rejected: adds migration overhead for value changes; string with application-level validation is sufficient for a small fixed set
- Separate `sortOrder` assignment via seeding — rejected: migrations are atomic; seeding is not

---

## Decision 6: Sortable Order Under Applied Sort

**Decision**: Store custom `sortOrder` as a persistent integer on the Task row; applied sorts (due date, priority) are client-side view transforms that do not modify `sortOrder`

**Rationale**: This means the database always holds the user's canonical custom order. Applying a sort by due date is purely a frontend array sort applied to the fetched task list — it never writes to the backend. Clearing the sort restores the original `sortOrder`-based list without any additional API call. Drag-and-drop updates persist by calling `PATCH /tasks/reorder` which batch-updates `sortOrder` values.

---

## New Frontend Dependencies

| Package | Purpose | Install |
|---|---|---|
| `@dnd-kit/core` | Drag-and-drop core | `npm i @dnd-kit/core` |
| `@dnd-kit/sortable` | Sortable list preset | `npm i @dnd-kit/sortable` |
| `@dnd-kit/utilities` | CSS transform helpers | `npm i @dnd-kit/utilities` |
| `framer-motion` | Modal/FAB animations | `npm i framer-motion` |
| `tailwindcss-animate` | Row enter/exit CSS | `npm i tailwindcss-animate` |
| `sonner` | Toast notifications | `npm i sonner` |
| `next-themes` | Dark mode | `npm i next-themes` |

## New Backend Dependencies

None — existing NestJS + Prisma + PostgreSQL stack is sufficient.
