# Quickstart: Todo App

**Branch**: `001-todo-app` | **Date**: 2026-05-15 | **Constitution**: v3.0.0

## Prerequisites

- Node.js 18+ installed
- All dependencies already installed (`npm install` from project root — no additional packages required)

## Run in Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build for Production

```bash
npm run build && npm run start
```

## Manual Acceptance Validation

### User Story 1 — Add and View Tasks

1. Open the app. Confirm an empty-state message is displayed.
2. Type a task and press **Enter**. Confirm task appears at the top of the list.
3. Click the **Add** button with text entered. Confirm task appears at the top.
4. Press Enter with an empty input. Confirm no task is added.
5. Type only spaces and press Enter. Confirm no task is added.
6. Add three tasks in sequence. Confirm newest task is always at the top.

### User Story 2 — Mark Done and Undo

1. Click the toggle button on a task. Confirm a strikethrough appears; task remains in list.
2. Click toggle again. Confirm strikethrough disappears.

### User Story 3 — Delete a Task

1. Click the delete button on a task. Confirm it is removed immediately.
2. Delete all tasks. Confirm the empty-state message reappears.

### User Story 4 — Persist Across Reloads

1. Add three tasks; mark one done.
2. Reload the page. Confirm all three tasks are present in the same order with the same completion states.
3. Delete one task; reload. Confirm the deleted task does not reappear.

### WCAG 2.1 AA / Keyboard Accessibility (FR-011, SC-006)

1. Tab through the page — confirm focus reaches: input field, Add button, each task's toggle, each task's delete button.
2. With focus on the input, type a task and press Enter. Confirm task is added.
3. With focus on a toggle button, press Space or Enter. Confirm task is toggled.
4. With focus on a delete button, press Space or Enter. Confirm task is deleted.
5. Use a screen reader (VoiceOver, NVDA). Confirm ARIA labels announce correctly.

### Constitution v3.0.0 Compliance

- [ ] `app/globals.css` contains only the three Tailwind directives — nothing else.
- [ ] No new CSS files created; no CSS-in-JS or external component library added.
- [ ] All interactive controls use native HTML elements (`<button>`, `<input>`, `<form>`).
- [ ] `STORAGE_KEY` defined once in `lib/storage.ts` and not duplicated.
- [ ] All browser-API components declare `"use client"` as their first line.
- [ ] `npm run build` succeeds with zero TypeScript errors.
- [ ] All interactive controls have explicit `aria-label` attributes.
