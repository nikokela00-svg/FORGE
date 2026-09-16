# app

Next.js App Router pages, layouts, and route handlers. This layer composes
feature slices and shared UI into screens. It contains **no business logic**:
no data fetching, no stores, no domain decisions — only wiring.

Rules:

- Default exports here are the sanctioned exception to the named-exports rule.
- Import features only through their barrel (`@/features/<name>`).
- Never place reusable components here — put them in a feature slice or
  `shared/` once two features need them.
