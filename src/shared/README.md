# shared

Cross-cutting code used by **two or more feature slices**.

- `ui/` — reusable presentational primitives (buttons, panels, overlays).
- `lib/` — pure utilities with zero React dependencies.
- `hooks/` — shared React hooks.
- `config/` — static site metadata and configuration.
- `types/` — shared type definitions and Zod schemas for external boundaries.

Rules:

- Nothing here may import from `features/` or `app/`.
- Code enters `shared/` only after real duplication across features —
  never pre-emptively.
- Everything in `lib/` and `hooks/` ships with unit tests.
