# ADR 0003: Zustand for State Management (Over Redux Toolkit)

## Status

Accepted

## Date

2026-09-16

## Context

FORGE requires client-side state management for UI state, feature flags,
editor configuration, terminal state, and derived computations. The state
requirements include:

- Multiple independent stores (editor, terminal, files, git, AI, UI chrome).
- Synchronous reads with minimal re-render overhead.
- Simple actions without middleware complexity.
- DevTools integration for debugging.
- TypeScript-first with excellent inference.

Options considered:

1. Redux Toolkit (RTK)
2. Zustand
3. Jotai (atomic state)
4. Signals (TC39 proposal / Preact signals)
5. React Context + useReducer
6. XState (state machines)

## Decision

We will use **Zustand** with one store per feature slice.

### Rationale

1. **Minimal API surface.** Zustand's entire API is `create()`, `set()`,
   `get()`, and selectors. There are no reducers, actions, dispatch,
   middleware chains, or provider wrappers. Less API = less to learn and
   less to get wrong.

2. **One store per feature = clean vertical slices.** Each feature slice
   gets its own Zustand store. No cross-contamination, no giant global
   store, no action namespace collisions.

3. **No Provider required.** Zustand stores exist outside the React tree.
   No `<Provider>` wrappers, no context nesting, no hydration order issues.
   Stores are importable directly.

4. **Superior TypeScript inference.** Zustand's `create<StoreType>()` infers
   state, actions, and selectors without manual type annotations on every
   call site. RTK requires more explicit typing.

5. **Selector-based re-renders.** Components subscribe to exact state
   slices via selectors. Zustand uses `Object.is` by default and supports
   shallow comparison. No unnecessary re-renders out of the box.

6. **DevTools and middleware.** Zustand integrates with Redux DevTools,
   persist middleware (for localStorage), and immer middleware (for complex
   state updates) — without adopting Redux's architecture.

7. **Bundle size.** Zustand is ~1KB gzipped. Redux Toolkit + React Redux
   is ~10KB gzipped. For a performance-critical editor, every byte matters.

## Consequences

### Positive

- Zero boilerplate to add a new store: one `create()` call, done.
- Stores are testable in isolation: import, call `getState()`, assert.
- No provider hierarchy means simpler component trees and faster renders.
- The `persist` middleware provides localStorage persistence for free —
  useful for preferences and UI state.

### Negative

- No opinionated middleware chain like RTK's `createAsyncThunk`. Async
  logic is handled with `async` actions directly, which means each feature
  team must follow consistent async patterns (enforced by convention and
  code review).
- Zustand's flexibility means stores can be misstructured. We enforce
  the convention of `state` + `actions` in every store via code review.
- No built-in RTK Query equivalent for data fetching. We use feature-scoped
  API modules with manual cache management or a future React Query adoption.

## Alternatives Considered

### Redux Toolkit

- **Pros:** Battle-tested, excellent DevTools, `createAsyncThunk` for
  async, RTK Query for data fetching, massive ecosystem.
- **Cons:** Boilerplate-heavy (slices, reducers, actions, dispatch),
  Provider required, larger bundle, steeper learning curve, one global
  store doesn't match our vertical-slice architecture.

### Jotai

- **Pros:** Atomic model, excellent for fine-grained reactivity, no
  providers.
- **Cons:** Atomic model doesn't map well to feature-slice architecture.
  Debugging distributed atoms is harder than inspecting a single store.
  Better for data-flow-heavy apps (forms, spreadsheets) than workspace
  tools.

### Signals (TC39 / Preact)

- **Pros:** Near-zero overhead, automatic dependency tracking, no selectors
  needed.
- **Cons:** Not yet standard (TC39 Stage 1), limited React ecosystem,
  no DevTools, no middleware. Premature for a production application.

### React Context + useReducer

- **Pros:** Built-in, no dependency.
- **Cons:** Re-renders all consumers on any state change, no DevTools,
  no persistence middleware, verbose for complex state. Unacceptable for
  a performance-critical editor.

### XState

- **Pros:** Formal state machines prevent invalid states, excellent for
  complex workflows.
- **Cons:** Heavy abstraction for UI state, steep learning curve,
  overkill for most feature stores. Could be used for specific complex
  state machines (git merge conflict resolution) but not as the
  global state solution.

### Verdict

Zustand's simplicity, performance, and architectural alignment with our
vertical-slice design make it the clear choice. We accept the trade-off
of manual async patterns in exchange for minimal complexity and maximum
developer velocity.
