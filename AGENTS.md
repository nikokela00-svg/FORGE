# FORGE — Engineering Constitution

FORGE is a local-first, AI-native developer workspace that runs entirely in
the browser. Think "VS Code meets GitHub Codespaces, but zero-install,
offline-first, and beautiful."

This document is the law of the codebase. Every future change references it.

---

## Quality Bar

**Production-grade or it doesn't merge.** Every line of code must meet the
standard we would ship to paying users. "It works on my machine" is never
acceptable. If in doubt, raise the bar.

---

## Code Standards

### TypeScript

- **Strict mode everywhere.** `strict: true`, `noUncheckedIndexedAccess: true`,
  `exactOptionalPropertyTypes: true`. No exceptions, no escape hatches.
- **No `any`.** Use `unknown` and narrow with type guards. The one-line
  exception is `as unknown as` casts that are documented with a rationale
  comment explaining why the type system cannot express the relationship.
- **Named exports only.** The sole exception is Next.js-required `default`
  exports for page/layout/route files.
- **Functions ≤ 40 lines.** If a function exceeds this, it is doing too much.
  Extract helpers or split into composable units.
- **One-line header comment per module.** The first line of every file states
  what the module does. No preamble, no JSDoc boilerplate — just a clear
  sentence.
- **Errors handled, never swallowed.** Every `try` block must have a meaningful
  `catch`. Empty `catch` blocks are a lint failure. Surface errors to the
  appropriate boundary.
- **Zod validation at every external boundary.** API responses, user input,
  environment variables, persisted data — anything that crosses a trust boundary
  must be validated with Zod and typed from the schema.

### Naming

- `camelCase` for variables, functions, parameters.
- `PascalCase` for types, interfaces, classes, React components, Zustand stores.
- `SCREAMING_SNAKE_CASE` for constants that are truly immutable across modules.
- Feature-scoped code lives under `src/features/<feature-name>/`.

---

## Architecture Rules

### Vertical Slices

Every feature is a self-contained vertical slice:

```
src/features/<name>/
  api/       # Data fetching, API client functions, request/response types
  ui/        # React components specific to this feature
  model/     # Zustand store, domain types, business logic
  lib/       # Feature-scoped utilities (not shared with other features)
```

### Shared Code

Shared code lives in `src/shared/` **ONLY** after two or more features need it.
Do not pre-emptively abstract. Duplication is cheaper than the wrong abstraction.

### Data Flow

- **UI never fetches data directly.** Components dispatch actions; stores
  orchestrate fetching; components read from stores.
- **State in Zustand stores, one per feature.** No global mega-store. No
  `useContext` for application state (React Query or Zustand only).
- **No prop drilling beyond 2 levels.** If a prop must travel further, use a
  store, context, or composition pattern.

### Layer Boundaries

- `features/` code may import from `shared/`. Never the reverse.
- `features/` code may import from other features ONLY through that feature's
  public API barrel export (`features/<name>/index.ts`).
- `shared/` modules must not import from `features/`.
- `app/` (Next.js pages/layouts) compose features; they contain no business
  logic.

---

## Git Standards

- **Conventional Commits** enforced via commitlint:
  `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`, `style:`, `ci:`.
- **Small, atomic commits.** One logical change per commit. If you can't
  describe the change in one sentence, split it.
- **No force-pushes to `main`.** Feature branches are rebased before merge.

---

## Testing

### Unit Tests (Vitest)

- All code in `lib/` and `model/` (stores) must have unit tests.
- Test behavior, not implementation. If refactoring breaks tests, the tests
  were wrong.
- Mock only external boundaries (network, IndexedDB). Never mock the module
  under test.

### Component Tests (Vitest + Testing Library)

- Interactive UI components get component tests.
- Test user-visible behavior: what renders, what happens on click/type/submit.
- Query by role, label, or text. Never by CSS class or data-testid unless no
  accessible alternative exists.

### End-to-End Tests (Playwright)

- Golden-path e2e tests per phase, not per PR.
- Test critical user journeys: boot → editor opens → type in editor → save.
- Run in CI against built output (`pnpm build && pnpm e2e`).

---

## Definition of Done

A task is complete **only when ALL of these pass**:

1. `pnpm typecheck` — zero errors
2. `pnpm lint` — zero warnings
3. `pnpm test` — all tests green
4. `pnpm build` — clean build
5. No `console.log` statements in production code
6. No dead code (unused exports, unreachable branches)
7. Documentation updated if architecture or API surface changed
8. Commit follows Conventional Commits format

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
