# Design System — FORGE

The design language is the contract every future feature composes against.
It is not a page of nice colors — it is the reason FORGE feels like FORGE.

---

## Principles

### 1. Invisible UI

The interface recedes, the content leads. Chrome is quiet: low-contrast
surfaces, hairline borders, no gradient noise. The moment something shouts,
it has a job — an error, a running process, the thing you're editing.
If a control can be quieter, it must be.

### 2. Dense but breathable

This is a professional tool for 8-hour days. Information density is high —
but written secondary text in muted tones, generous line-height on labels,
hairline one-pixel borders instead of fat cards. Density without noise.

### 3. Keyboard-first, visibly so

Every interaction is reachable by keyboard. Focus states are unmistakable
(the accent ring) so keyboard users always know where they are. Shortcuts
are rendered as `Kbd` chiclets wherever they exist — the product teaches
its own keyboard as you use it.

### 4. Motion is information

Motion is short and purposeful. It tells you _where things came from_
(popovers zoom from their trigger, dialogs rise), never _how fancy we are_.
Only `transform` and `opacity` animate — never layout properties. If a
transition isn't explaining something, it's removed.

### 5. One accent

Molten orange. Used sparingly and only for: **primary actions**, **focus**,
and **active state**. It is never decoration. When you see orange, the
system is telling you something — "this is the thing".

---

## Token Architecture

Three tiers. Components consume **semantic** tokens only.

```
┌────────────────────────────────────────────────────────────────────┐
│  PRIMITIVE — raw scales (tokens.css)                                │
│  neutral-0..11, accent-0..11, red/amber/green/blue-0..11,           │
│   type sizes, spacing, radii, durations, easings                    │
│  Never referenced by components.                                    │
├────────────────────────────────────────────────────────────────────┤
│  SEMANTIC — role-based (tokens.css, per theme)                      │
│  --bg, --surface-1..3, --border*, --fg*, --accent*,                 │
│   --success/warning/danger/info (+ -muted), --focus-ring,           │
│   --selection, --overlay, shadows e1..e3, z-index                   │
│  What components compose.                                           │
├────────────────────────────────────────────────────────────────────┤
│  COMPONENT — only where truly needed (inside components)            │
│  Composited variants: e.g. a button's hover state.                  │
│  Kept out of the global namespace; realized with Tailwind classes   │
│  composed from semantic utilities + opacity modifiers.              │
└────────────────────────────────────────────────────────────────────┘
```

### Rules

- No hex/oklch/hsl values outside `tokens.css`. Enforced by code review;
  arbitrary color classes are lint-flagged.
- No arbitrary Tailwind values (`w-[347px]`, `text-[13px]`). Spacing,
  radii, and type come from the scales. Exceptions require an
  `eslint-disable` comment with the justification.
- Opacity modifiers on semantic tokens (`bg-accent/15`) **are** permitted:
  they modulate a semantic token's alpha without introducing a new hue.
- The dark theme is the default and the design's origin. Light derive.

---

## Accessibility

### Contrast (WCAG 2.2 AA)

Every semantic token pairing used for text meets ≥ 4.5:1 (normal text) and
≥ 3:1 (large text, non-text). Documented pairs (dark / light):

| Pair (text on bg)           | Dark ratio | Light ratio | Status |
| --------------------------- | ---------- | ----------- | ------ |
| `--fg` on `--bg`            | 15.2:1     | 14.1:1      | AAA    |
| `--fg` on `--surface-1`     | 13.2:1     | 13.9:1      | AAA    |
| `--fg-muted` on `--bg`      | 7.9:1      | 7.1:1       | AAA    |
| `--fg-subtle` on `--bg`     | 5.1:1      | 4.7:1       | AA     |
| `--accent` on `--bg`        | 4.9:1      | 5.6:1       | AA     |
| `--accent-fg` on `--accent` | 7.6:1      | 5.9:1       | AAA    |
| `--success` on `--bg`       | 6.6:1      | 6.2:1       | AA     |
| `--warning` on `--bg`       | 6.2:1      | 4.6:1       | AA     |
| `--danger` on `--bg`        | 6.3:1      | 5.9:1       | AA     |
| `--info` on `--bg`          | 5.6:1      | 6.4:1       | AA     |

Non-text contrast: `--focus-ring` against `--surface-1` ≥ 3:1; `--border`
is a style cue only, never the sole information channel.

### Focus

- Every interactive element has a visible focus ring: `ring-2 ring-focus-ring`
  with an offset in `--bg`, shown on `:focus-visible` only.
- Number row or shortcuts are announced through tooltips + `Kbd`, never
  through focus styling alone.

### Targets

- Minimum visible target 24 × 24 px (smol controls like `Kbd` are
  informational, not interactive).
- Minimum touch target 44 × 44 px applied to touch input via the
  `min-[...]` touch query where the control is under 44 px.

### Reduced motion

A single global rule honors `prefers-reduced-motion`: animations collapse
to near-instant, infinite animations stop, smooth-scroll becomes auto.
Individual decorative animations additionally carry `motion-reduce:animate-none`.

---

## Motion

| Name    | Duration | Used for                                          |
| ------- | -------- | ------------------------------------------------- |
| instant | 70ms     | color/bg swaps, focus ring appears                |
| fast    | 120ms    | hovers, small reveals                             |
| base    | 200ms    | standard transitions, dialog/popover in           |
| slow    | 320ms    | deliberate reveals (toast batch, panel expansion) |

| Easing            | Curve                    | Use              |
| ----------------- | ------------------------ | ---------------- |
| `--ease-standard` | `cubic-bezier(.2,0,0,1)` | most motion      |
| `--ease-entrance` | `cubic-bezier(0,0,.2,1)` | things appearing |
| `--ease-exit`     | `cubic-bezier(.4,0,1,1)` | things leaving   |

Rules:

- Animate **transform + opacity only**.
- Enter: quick-out easing, 4–8 px travels. Exit: quick-in, faster.
- Never animate margins, width/height, or background-position.
- Durations come from the tokens; never hand-typed `duration-150`.

---

## The System at a Glance

- Accent = molten orange (`--accent`). It is the forge's fire; keep the
  ember count low in the UI.
- Editors and terminals sit on `--surface-1`; chrome on `--surface-2`;
  popovers/floats on `--surface-3`.
- Text: `--fg` primary, `--fg-muted` secondary, `--fg-subtle` tertiary.
- Status colors are muted, editor-grade: they read as state at a glance
  without shouting candy.
- Full token inventory: `src/styles/tokens.css`. Theme wiring:
  `src/app/globals.css`.

---

## Implementation

- **Primitives:** every interactive UI component lives in `src/shared/ui`,
  exportable only through the barrel `src/shared/ui/index.ts`. Radix UI
  provides the headless accessibility layer (see
  [ADR 0004](adr/0004-radix-primitives.md)); wrappers add nothing but token
  classes via `cn()`.
- **Showcase:** run `pnpm dev` and open `/design-system` — a dev-only,
  axe-scanned living reference of every primitive. It is compiled to 404 in
  production builds.
- **Guards:** unit and component tests live under `tests/unit/shared/ui/`;
  an e2e axe scan runs against the showcase in `tests/e2e/design-system.spec.ts`.
