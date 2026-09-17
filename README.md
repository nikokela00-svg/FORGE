# FORGE

[![CI](https://github.com/forge/forge/actions/workflows/ci.yml/badge.svg)](https://github.com/forge/forge/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A local-first, AI-native developer workspace that runs entirely in the
browser. Zero-install, offline-first, and beautiful.

## Features

- **Workspace shell (v0.3.0)** — resizable activity bar, sidebar, and
  collapsible terminal panel; persists layout across reloads; degrades to a
  drawer on small screens.
- **Global keyboard manager** — `Mod+B` toggles the sidebar, `Mod+J` the
  terminal panel, `Shift+?` opens the shortcuts dialog (⌘ on macOS, Ctrl
  elsewhere).
- **Status bar with contribution points** — features plug in status items; the
  bar also mirrors the theme, reports online state, and shows the version.
- **Virtual file system (v0.5.0)** — IndexedDB-persisted workspaces,
  imports folders from disk via the File System Access API, ships with a
  one-click demo workspace.
- **File explorer (v0.5.0)** — expandable tree with inline create and rename,
  context menus with copy-path and delete, native drag-and-drop moves, full
  keyboard navigation, and a read-only text preview host.

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
- [Keybindings](docs/KEYBINDINGS.md) — the shell's default shortcuts
- [Design System](docs/DESIGN_SYSTEM.md) — tokens, motion, and UI primitives
- [Engineering Constitution](AGENTS.md)
- [Architecture Decision Records](docs/adr/)

## Design System

Run `pnpm dev` and open [http://localhost:3000/design-system](http://localhost:3000/design-system)
to browse every UI primitive. The route is stripped from production builds.

## License

MIT
