# ADR 0001: Next.js with App Router

## Status

Accepted

## Date

2026-09-16

## Context

FORGE is primarily a client-side application — the editor, terminal, files,
and AI features all run in the browser. There is no server-side rendering of
dynamic data, no API routes serving business logic, and no database on the
server.

The team considered whether Next.js is appropriate for what is essentially a
single-page application, or whether a lighter framework (Vite + React, or
even vanilla React) would be more suitable.

## Decision

We will use **Next.js (latest stable) with the App Router** as the
application framework.

### Rationale

1. **App Router as the modern standard.** The App Router's React Server
   Component model, parallel routes, intercepting routes, and streaming
   provide infrastructure we will need as the product grows — even if we
   lean heavily on client components today.

2. **Font optimization.** `next/font` provides zero-layout-shift font
   loading with automatic self-hosting. Critical for a code editor's
   monospace typography.

3. **Static export path.** `output: 'export'` produces a pure static build
   deployable to any CDN, which aligns with our "no server runtime"
   constraint while still giving us the Next.js DX.

4. **Ecosystem gravity.** Next.js has the largest React ecosystem:
   tutorials, templates, plugins, and hiring pool. Senior engineers
   already know it.

5. **Progressive complexity.** When we add server features in v3 (collab,
   model hosting), the App Router's server components and route handlers
   are ready without a framework migration.

## Consequences

### Positive

- Zero-config font optimization and image optimization (when needed).
- File-system routing reduces boilerplate for new screens.
- Built-in CSS/Tailwind support with zero configuration.
- The `next/link` and `next/navigation` APIs prevent broken links and
  enable prefetching.

### Negative

- Client-heavy apps fight against RSC boundaries. We must explicitly mark
  most components with `'use client'`. This is a minor DX friction.
- The build output for `output: 'export'` is larger than a pure Vite SPA
  because of Next.js runtime overhead. We mitigate with aggressive code
  splitting.
- App Router is still evolving. Breaking changes between minor versions
  require maintenance attention.

## Alternatives Considered

### Vite + React Router

- **Pros:** Faster dev server HMR, smaller bundle, no RSC confusion.
- **Cons:** No font optimization, no built-in routing conventions, no
  static export optimization, smaller ecosystem. We would build routing
  conventions from scratch.

### Remix

- **Pros:** Excellent data loading patterns, web-standards-first approach.
- **Cons:** Server-oriented by design. Static export is not a first-class
  path. The team has less Remix experience.

### Astro

- **Pros:** Excellent static output, partial hydration.
- **Cons:** Not React-native. Islands architecture conflicts with our
  interactive editor requirement.

### Verdict

Next.js with App Router provides the best balance of DX, ecosystem,
static deployment capability, and future extensibility for FORGE's
unique position as a browser-native workspace.
