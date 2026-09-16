# shared/ui

Reusable, presentational UI primitives shared by two or more features.

- Components here are dumb: they accept props and render. No data fetching,
  no store access, no business logic.
- Interactive components get component tests (Vitest + Testing Library).
- Style with design-system tokens (see `src/styles`), never ad-hoc colors.
