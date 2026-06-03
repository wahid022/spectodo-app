# Implementation Plan: Todo App

**Branch**: `001-todo-app` | **Date**: 2026-05-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-todo-app/spec.md`

## Summary

Build a client-side-only single-page todo application using Next.js 14 + TypeScript + Tailwind CSS. Users can add tasks, view them newest-first, mark them done/undo, delete them, and have all data persist across page reloads via `localStorage`. The app must meet WCAG 2.1 AA accessibility standards — all controls keyboard-accessible with ARIA labels. No external design system or CSS-in-JS library is used.

## Technical Context

**Language/Version**: TypeScript 5.x (bundled with Next.js 14)

**Primary Dependencies**: Next.js 14 (App Router), React 18, Tailwind CSS — all already installed

**Storage**: `localStorage` (browser client-side, serialised as JSON)

**Testing**: Not requested in spec

**Target Platform**: Modern browsers (Chrome, Firefox, Safari, Edge) — WCAG 2.1 AA required

**Project Type**: Single-page web app (static, client-side only)

**Performance Goals**: Immediate UI feedback; handles 50+ tasks without degradation

**Constraints**: No server-side logic; no API routes; no external UI libraries; WCAG 2.1 AA; offline-capable

**Scale/Scope**: Single user, personal task management

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Status |
| --------- | ----- | ------ |
| I. Client-Side Only Stack | No API routes, no backend. Tailwind CSS is the styling layer. No external design systems. localStorage only. | ✅ PASS |
| II. Code Organisation | Page in `app/page.tsx`, components in `app/components/`, storage in `lib/storage.ts`. All browser-API components declare `"use client"`. | ✅ PASS |
| III. Styling Discipline | Tailwind utility classes only. `app/globals.css` stripped to three Tailwind directives only. No CSS files, no CSS-in-JS, no external component libraries. | ⚠ Needs fix: current `globals.css` has extra boilerplate from `create-next-app` — corrected during implementation |
| IV. Data Conventions | Canonical `Todo` shape: `{ id, text, completed, createdAt }`. IDs via `crypto.randomUUID()`. Single `STORAGE_KEY` constant in `lib/storage.ts`. | ✅ PASS |
| V. UI Behaviour | Single page, empty state, newest-first ordering, strikethrough on completed tasks, completed tasks remain in list. | ✅ PASS |

**Gate result**: PASS (Principle III violation is create-next-app boilerplate — corrected in implementation, not a design violation)

## Project Structure

### Documentation (this feature)

```text
specs/001-todo-app/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── components.md    # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
app/
├── page.tsx              # Main page — owns todo state (useState/useEffect)
├── globals.css           # Three Tailwind directives only
└── components/
    ├── TodoInput.tsx     # Input field + "Add" button ("use client")
    ├── TodoList.tsx      # List container + empty-state display ("use client")
    └── TodoItem.tsx      # Single task row: toggle + delete ("use client")

lib/
└── storage.ts            # Todo type, STORAGE_KEY constant, loadTodos(), saveTodos()
```

**Structure Decision**: Next.js App Router single-page layout. `app/page.tsx` is a client component that owns all todo state via `useState` + `useEffect`. Child components receive data and callbacks via props. `lib/storage.ts` centralises persistence logic and the canonical `Todo` type. All styling via Tailwind utility classes co-located with each component's JSX.
