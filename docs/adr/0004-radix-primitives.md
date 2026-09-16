# ADR 0004: Radix Primitives for the Shared Design System

## Status

Accepted

## Date

2026-09-16

## Context

FORGE needs an accessible, composable set of interactive UI primitives
(buttons, dialogs, dropdowns, selects, tabs, tooltips, toasts) that obey a
single semantic token scale. The requirements:

- WCAG 2.2 AA out of the box: keyboard navigation, focus management, ARIA
  wiring, and reduced-motion support.
- Headless composition so every pixel is controlled by the design tokens —
  no imported component CSS to fight.
- Unstyled behavior in unit tests (jsdom) so components can be verified
  without a browser.
- Consistent motion and elevation language shared across every overlay.

Options considered:

1. Build every primitive from scratch.
2. Use a styled component library (shadcn/ui copy, Mantine, Radix Themes).
3. Use headless primitives (Radix UI) wrapped in our own styled surface.

## Decision

Use **Radix UI primitives** wrapped one-to-one by thin styled components in
`src/shared/ui/`, shipped through a single barrel `src/shared/ui/index.ts`.
Every dart of styling comes from the semantic token classes defined in
`src/styles/tokens.css`.

### Rationale

1. **Accessibility for free, verified by us.** Radix handles focus trap,
   arrow-key navigation, `aria-*` state, and Escape handling. We still run
   axe audits — unit-level on open overlays and an e2e scan over the
   dev-only `/design-system` showcase — so compliance is continuously
   re-verified rather than assumed.

2. **Headless keeps tokens authoritative.** Radix renders no pixel styling.
   The wrapper components are thin: props pass-through plus a `cn()`
   tailwind-merge class string. There is exactly one place where a color,
   shadow, or z-index can enter the DOM: the token scale. No secondary
   styling system can leak in.

3. **Named, discoverable surface.** The barrel exports only what we own
   (`Button`, `DialogContent`, …), never raw Radix nodes. Features import
   from `@/shared/ui`; swapping the underlying library later would not
   touch feature code.

4. **Testability.** Radix is headless and portal-based, so components render
   fully in jsdom with only small pointer-capture polyfills. Each primitive
   carries behavior tests, and each test drives real user gestures
   (`user-event`) rather than implementation details.

5. **Portal + motion orchestration.** Radix `Portal`, `aria-modal`, and
   focus handling compose cleanly with the tw-animate-css enter/exit classes
   (`animate-in`, `zoom-in-95`, `slide-in-from-*`) that are keyed to the
   motion duration/ease tokens.

## Consequences

### Positive

- Consistent a11y baseline across all interactive UI with zero per-primitive
  reimplementation cost.
- All styling converges on the token scale; `forge/no-arbitrary-tailwind`
  keeps even the wrappers from inventing raw values.
- Overlay composition (dialog → dropdown → tooltip stacking) is handled by
  the z-index token scale and Radix's portal layering.
- Unit and e2e axe gates catch regressions without manual QA.

### Negative

- A Radix upgrade can change DOM/ARIA shape; wrapper tests and the axe
  scans are the safety net and must stay green.
- Radix is headless, so every interactive primitive we adopt must be
  wrapped before use — no shortcuts past the barrel.
- tw-animate-css provides enter animations only; exit animations are a
  known future gap (unmount animations) tracked separately.

## Alternatives Considered

### Hand-rolled primitives

- **Pros:** Zero dependencies, full control.
- **Cons:** Reimplementing focus traps, arrow-key navigation, and ARIA is
  expensive and prone to subtle regressions that a codebase this small
  cannot afford to maintain.

### Styled component libraries (shadcn/ui copy, Mantine, Radix Themes)

- **Pros:** Faster to start, battle-tested looks.
- **Cons:** Bring their own design language, forcing either token remapping
  or accepting foreign styling — both contradict a single authoritative
  token scale.

### Verdict

Thin Radix wrappers give us production-grade accessibility with zero
styling leakage, which is exactly the contract the design system needs.
