# src

Application source. Everything here is TypeScript, strict mode, named
exports (except Next.js-required defaults).

```
src/
  app/       Next.js App Router pages and layouts — composition only
  shared/    Cross-cutting utilities for 2+ features
  features/  Vertical feature slices
  styles/    Global styles and design tokens
```

Layer rules (see AGENTS.md): `features/` → `shared/` → nothing. `shared/`
and `app/` never import from `features/`.
