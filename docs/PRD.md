# Product Requirements Document — FORGE v1

## Problem Statement

Professional developers waste hours on environment setup, syncing, and
toolchain friction. Cloud IDEs (Codespaces, Gitpod) solve the setup problem
but introduce latency, connectivity dependence, and subscription costs. Local
editors (VS Code) are powerful but require installation and manual
synchronization of state.

There is no developer workspace that is simultaneously zero-install,
offline-first, AI-native, and beautiful.

## Target User

**Professional developers** who:

- Work across multiple machines (laptop, desktop, tablet).
- Spend 8+ hours daily in their editor/IDE.
- Use Git workflows, terminal commands, and AI-assisted coding daily.
- Value speed, reliability, and keyboard-driven workflows.
- Care about data sovereignty — their code and state stay on their machine.

## Product Pillars

### 1. Editor

A full-featured code editor with syntax highlighting, multi-cursor, bracket
matching, minimap, and VS Code keybindings. Powered by Monaco Editor with
deep customization.

### 2. Terminal

Integrated terminal(s) with split panes, tabs, and full PTY emulation via
xterm.js. Multiple concurrent sessions. Command history persisted locally.

### 3. Files

A virtual filesystem backed by IndexedDB (Dexie). Supports the full
filesystem API surface: read, write, rename, delete, mkdir, glob search.
Drag-and-drop import. Export as ZIP. The filesystem survives browser restarts.

### 4. Version Control

Git operations via isomorphic-git (pure JS, no native dependencies). Clone,
commit, branch, diff, merge — all in-browser. Visual diff views for files.

### 5. Extensions

A plugin system for editor extensions, themes, and keybindings. Extensions
are sandboxed (no node_modules, no network). Discovery via a built-in
marketplace index.

### 6. AI

First-class AI integration: inline completions, chat panel, code explanation,
refactoring suggestions. Provider-agnostic (OpenAI, Anthropic, local models).
AI context is scoped to the current workspace and conversation.

## Non-Goals for v1

- **No server-side execution.** FORGE v1 does not run code — it is a
  workspace, not a runtime. Code execution is deferred to v2.
- **No real-time collaboration.** Multiplayer editing is a v2 feature.
- **No native desktop app.** The browser is the platform. Electron is
  explicitly excluded.
- **No mobile support.** Tablet and desktop browsers only. Phone screens are
  too small for a professional workspace.
- **No custom AI model hosting.** v1 integrates with external providers
  only. Self-hosted model support is v3.
- **No Docker/container integration.** No container orchestration in v1.

## Success Metrics

| Metric                         | Target         | Measurement            |
| ------------------------------ | -------------- | ---------------------- |
| Cold boot to editor ready      | < 2 seconds    | Performance API        |
| Offline filesystem persistence | 100%           | IndexedDB crash test   |
| Editor input latency (p99)     | < 16ms         | requestAnimationFrame  |
| Bundle size (initial load)     | < 500KB gzip   | Next.js build output   |
| Lighthouse performance score   | ≥ 95           | Lighthouse CI          |
| Zero-install adoption          | Open URL, code | User testing           |
| Test coverage (lib + stores)   | ≥ 90%          | Vitest coverage report |
| CI pass rate on main           | 100%           | GitHub Actions         |

## Constraints

- Must work offline after first load (service worker caching).
- Must function in Chrome 100+, Firefox 110+, Safari 16+, Edge 100+.
- No data leaves the browser without explicit user consent.
- Must degrade gracefully without JavaScript (static shell with retry prompt).
