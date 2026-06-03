# Research: Todo App

**Branch**: `001-todo-app` | **Date**: 2026-05-15 | **Constitution**: v3.0.0

## Overview

Stack is fully prescribed by constitution v3.0.0: Next.js 14, TypeScript, React 18, Tailwind CSS. No external design system or CSS-in-JS library. This document records key design decisions for the implementation.

---

## Decision 1: State Management

**Decision**: `useState` hook in `app/page.tsx` owns the todo list. No external state library.

**Rationale**: Flat state (array of Todo objects) on a single page. `useState` + `useEffect` is sufficient and introduces no extra dependencies. Lifting state to the page and passing callbacks down keeps the architecture simple.

**Alternatives considered**:

- Context API — unnecessary for a single page with a shallow component tree.
- Zustand / Redux — far too heavy for this scope.

---

## Decision 2: localStorage Integration

**Decision**: Load from `localStorage` on mount (`useEffect` with `[]` dependency). Persist on every `todos` state change (`useEffect` on `[todos]`).

**Rationale**: Separates initial hydration from ongoing persistence. Idiomatic React pattern that avoids stale closures. The `"use client"` directive on `app/page.tsx` ensures hooks only run in the browser.

**Alternatives considered**:

- Calling `localStorage` in event handlers directly — misses the initial load; duplicates logic.
- Custom `useTodos` hook — valid but an extra layer not warranted at this scope.

---

## Decision 3: Component Decomposition

**Decision**: Three components in `app/components/` — `TodoInput`, `TodoList`, `TodoItem`. All declare `"use client"`.

**Rationale**: Each component has a single responsibility. `TodoInput` manages the text field and submission. `TodoList` renders the list or empty state. `TodoItem` renders a single row. This satisfies constitution Principle II and keeps `app/page.tsx` focused on state.

**Alternatives considered**:

- Everything in `app/page.tsx` — works but becomes unwieldy.
- More granular splitting — premature at this scope.

---

## Decision 4: Newest-First Ordering

**Decision**: Prepend new todos to the array (`[newTodo, ...prev]`), maintaining newest-first order in the data structure without sorting.

**Rationale**: O(1) array copy; no runtime sort needed. `Array.map()` displays items in natural array order.

---

## Decision 5: Input Validation and Submission

**Decision**: Wrap `TodoInput` in an HTML `<form>` with an `onSubmit` handler. Trim whitespace; reject empty strings silently. Both Enter key and "Add" button click submit the form (native browser behaviour).

**Rationale**: FR-001 (Enter or button click) and FR-004 (reject empty input) are satisfied. Wrapping in `<form>` gives Enter-key submission for free — no extra keydown listener needed. This also improves accessibility.

---

## Decision 6: Accessibility (WCAG 2.1 AA)

**Decision**: Use semantic HTML (`<form>`, `<ul role="list">`, `<li>`, `<button>`) and explicit `aria-label` attributes on all interactive controls.

**Rationale**: FR-011 mandates WCAG 2.1 AA. Native HTML elements provide keyboard focus, Enter/Space activation, and screen-reader semantics automatically. Tailwind provides sufficient colour contrast with default palette (white/black/gray). Dynamic `aria-label` on toggle buttons ("Mark as complete" / "Mark as incomplete") communicates task state to screen readers.

**Approach**:

- `TodoInput`: `<form>` wrapping `<input>` (label) + `<button type="submit">Add</button>`
- `TodoItem` toggle: `<button aria-label="Mark '...' as complete/incomplete">`
- `TodoItem` delete: `<button aria-label="Delete task: ...">`
- Task list: `<ul role="list">` with `<li>` per task

---

## Decision 7: globals.css Cleanup

**Decision**: Replace `app/globals.css` with exactly the three Tailwind directives.

**Rationale**: Constitution Principle III mandates this. The create-next-app boilerplate includes CSS custom properties and a `body` rule — these must be removed. Background and foreground colours will be applied via Tailwind utility classes on the page root element.
