# shared/types

Shared type definitions and Zod schemas for external boundaries.

Rules:

- Types used by exactly one feature live in that feature's `model/`, not here.
- Schemas validate anything crossing a trust boundary (API, storage,
  user input) — see the constitution's Zod rule.
