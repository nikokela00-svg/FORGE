# FORGE

[![CI](https://github.com/forge/forge/actions/workflows/ci.yml/badge.svg)](https://github.com/forge/forge/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A local-first, AI-native developer workspace that runs entirely in the
browser. Zero-install, offline-first, and beautiful.

## Quickstart

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Requires Node.js LTS (see `.nvmrc`) and [pnpm](https://pnpm.io).

## Scripts

| Script               | What it does                                   |
| -------------------- | ---------------------------------------------- |
| `pnpm dev`           | Start the Next.js dev server                   |
| `pnpm build`         | Export a production static build to `out/`     |
| `pnpm start`         | Serve the exported build locally               |
| `pnpm typecheck`     | TypeScript strict typecheck                    |
| `pnpm lint`          | ESLint (flat config, typescript-eslint strict) |
| `pnpm format`        | Format everything with Prettier                |
| `pnpm format:check`  | Verify formatting                              |
| `pnpm test`          | Vitest unit + component tests (jsdom)          |
| `pnpm test:coverage` | Vitest with coverage report                    |
| `pnpm e2e`           | Playwright end-to-end tests (chromium)         |
| `pnpm e2e:install`   | Install the Playwright Chromium browser        |

## Documentation

- [Product Requirements](docs/PRD.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Engineering Constitution](AGENTS.md)
- [Architecture Decision Records](docs/adr/)

## License

MIT
