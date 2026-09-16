# ADR 0005: react-resizable-panels for Shell Layout

## Status

Accepted

## Date

2026-09-16

## Context

FORGE's workspace shell requires draggable resizable panels — a sidebar whose
width the user can drag, a collapsible bottom terminal panel, and a main
editor area that fills the remainder. The resizer must:

- Expose correct ARIA semantics (`role="separator"`, keyboard arrow-key
  resizing, focus management).
- Handle multi-axis layout (horizontal sidebar + vertical panel) without
  nested resize conflict.
- Be safe for SSR/SSG (no `window`-dependent layout effects at render time).
- Provide a simple collapse/expand imperative API for keyboard-driven toggles
  (`⌘B`, `⌘J`).

Options considered:

1. Hand-rolled resizers (pointer event handlers, CSS `resize`, or
   `user-select: none` + manual clamping).
2. `react-resizable-panels` (headless, ARIA-correct, SSR-safe, zero
   styling — we add all styling ourselves).

## Decision

Use **react-resizable-panels v4** (`Group`, `Panel`, `Separator`).

### Rationale

1. **Correct keyboard and pointer handling for free.** Resize handles emit
   proper `role="separator"` with `aria-orientation`, `aria-valuenow`, and
   arrow-key resizing — without us writing or maintaining that state machine.
   Hit-area sizing is pointer-coarseness-aware.

2. **SSR and SSG safe.** The library uses CSS flex percentages, not
   `ResizeObserver` for initial paint. Panels hydrate without layout shift
   when `defaultSize` is specified in pixels — critical for Next.js static
   export where the shell renders on the server.

3. **Collapse/expand imperative API.** `panelRef.collapse()` and
   `panelRef.expand()` provide deterministic toggling for `⌘B` and `⌘J`,
   while the library also handles user-drag-to-close via `collapsible`
   and `collapsedSize={0}`.

4. **Zero styling.** The library emits no CSS — every separator and panel is
   a plain `div` we style with the token classes. There is no imported
   stylesheet to reconcile with the design system.

5. **Actively maintained with a clean v4 API.** `onLayoutChanged` fires
   exactly when user interaction ends, giving us a stable hook for persisting
   pixel sizes into the shell store without debouncing.

## Consequences

### Positive

- Keyboard resizing, ARIA separator semantics, and pointer clamping are all
  handled correctly without ongoing maintenance cost.
- The separation of `onResize` (real-time during drag) and `onLayoutChanged`
  (post-interaction) lets us persist to the store cheaply.
- `isCoarsePointer()` lets us enlarge the hit area on touch devices without
  a media query.

### Negative

- A dependency (v4) carries maintenance overhead — mitigated by a focused
  surface (only three component names) and pinned version.
- `defaultSize` is evaluated once at mount; our Zod-validated store
  provides the correct initial pixel values synchronously, so this is
  unproblematic in practice.

## Alternatives Considered

### Hand-rolled resizers

- **Pros:** No dependency; complete control.
- **Cons:** Building correct keyboard resize, ARIA semantics, multi-panel
  layout preservation, and `ResizeObserver` coordination is substantial
  surface area to get right and maintain. The risk of subtle a11y gaps is
  not worth the dependency weight.

### CSS `resize` property

- **Pros:** Built-in.
- **Cons:** No ARIA semantics, no keyboard resize, no collapse/expand, no
  multi-panel coordination. Unusable for an accessible IDE shell.

### Verdict

react-resizable-panels is the correct tool for the exact contract the shell
needs, with zero styling to undo and robust a11y out of the box.
