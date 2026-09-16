// Feature slice providing a living showcase of the shared design system

# design-system

A dev-only showcase page (`/design-system`) that renders every shared UI
primitive through the semantic token scale. It exists so teams can eyeball
tokens and intercept a11y regressions via the e2e axe scan; it has no
business logic and never ships to production builds.

Consumed solely by `src/app/design-system/page.tsx`, which returns 404 when
`NODE_ENV !== "development"`.
