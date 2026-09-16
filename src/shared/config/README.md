# shared/config

Static configuration that more than one feature reads.

- `site.ts` — central site/app metadata (name, description, version).
- Anything secret or machine-specific belongs in environment variables,
  validated with Zod at the boundary — never hard-coded here.
