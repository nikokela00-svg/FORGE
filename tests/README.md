# tests

All automated tests, split by level:

```
tests/
  setup.ts        Vitest global setup (jest-dom matchers)
  unit/           Vitest unit + component tests (jsdom)
  e2e/            Playwright golden-path tests (chromium)
```

Conventions (see AGENTS.md):

- Unit-test every `lib/` and `model/` module. Test behavior, not
  implementation.
- Component tests query by role/label/text — never by CSS class.
- E2e runs against the exported build via `scripts/serve.mjs`
  (`pnpm build && pnpm e2e`).
