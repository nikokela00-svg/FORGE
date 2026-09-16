# features

Self-contained vertical slices. Each feature owns everything it needs:

```
src/features/<name>/
  api/       data fetching, API clients, request/response types
  ui/        React components specific to this feature
  model/     Zustand store, domain types, business logic
  lib/       feature-scoped utilities
  index.ts   public barrel — the ONLY import surface for other layers
```

Rules:

- Add a new feature only when a real product capability exists — no
  speculative slices.
- No feature may import another feature's internals; import the barrel.
- A feature's `index.ts` exports only what the rest of the app may consume.
- `model/` and `lib/` code must be covered by unit tests.
