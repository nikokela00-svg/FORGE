# Architecture — FORGE

## System Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Browser (Client)                            │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  Next.js App │  │  Service     │  │  Web Workers             │  │
│  │  Router      │  │  Worker      │  │  ┌────────┐ ┌─────────┐ │  │
│  │  (UI Shell)  │  │  (Offline    │  │  │ git    │ │  AI     │ │  │
│  │              │  │   Cache)     │  │  │ worker │ │  worker │ │  │
│  │  ┌────────┐  │  └──────────────┘  │  └────────┘ └─────────┘ │  │
│  │  │ Pages  │  │                    └──────────────────────────┘  │
│  │  │ Layouts│  │                                                  │
│  │  └────────┘  │  ┌──────────────────────────────────────────┐   │
│  │              │  │  Feature Slices                            │   │
│  │  ┌────────┐  │  │  ┌─────────┐ ┌─────────┐ ┌───────────┐  │   │
│  │  │Shared  │  │  │  │ Editor  │ │ Terminal│ │  Files    │  │   │
│  │  │ UI/Lib │  │  │  │ Feature │ │ Feature │ │  Feature  │  │   │
│  │  └────────┘  │  │  └─────────┘ └─────────┘ └───────────┘  │   │
│  │              │  │  ┌─────────┐ ┌─────────┐ ┌───────────┐  │   │
│  │              │  │  │  Git    │ │ Extens. │ │    AI     │  │   │
│  │              │  │  │ Feature │ │ Feature │ │  Feature  │  │   │
│  │              │  │  └─────────┘ └─────────┘ └───────────┘  │   │
│  │              │  └──────────────────────────────────────────┘   │
│  └──────────────┘                                                 │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Persistence Layer                                           │  │
│  │  ┌────────────┐  ┌────────────┐  ┌───────────────────────┐  │  │
│  │  │  Zustand   │  │   Dexie    │  │   localStorage        │  │  │
│  │  │  (State)   │  │  (VFS)     │  │   (Preferences)       │  │  │
│  │  └────────────┘  └────────────┘  └───────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## Layer Responsibilities

### App Layer (`src/app/`)

Next.js App Router pages and layouts. Responsible for routing, metadata,
font loading, and composing feature slices into coherent screens. Contains
no business logic — purely declarative composition.

### Feature Layer (`src/features/`)

Self-contained vertical slices. Each feature owns its UI, state, API calls,
and types. Features communicate through Zustand stores or shared utilities —
never through prop drilling or global event buses.

### Shell Layer (`src/features/shell/`)

The workspace shell is the permanent IDE frame every feature plugs into. It
owns the frame and the wiring, and nothing about any feature's domain.

| Concern          | Owner                  | How features participate                                  |
| ---------------- | ---------------------- | --------------------------------------------------------- |
| Window layout    | Shell                  | Not extensible; panels are fixed regions                  |
| Activity bar     | Shell (static views)   | Views are a fixed registry of four `activeView` ids       |
| Sidebar          | Shell (frame + header) | View body content comes from `views/{view}-view.tsx`      |
| Bottom panel     | Shell (frame)          | Terminal pane content arrives with the terminal phase     |
| Status bar       | Shell (frame)          | Items are contributed via `status-registry.ts`            |
| Keybindings      | Shell                  | Registry (`keybindings.ts`) is the single source of truth |
| Persistent prefs | Shell                  | Zod-validated rehydration in `shell-store.ts`             |

Shell owns layout geometry, the global keyboard listener, panel collapse,
and the status-bar contribution point. Features own their content and may
register status items or future contributions without touching shell code.
The contribution-point pattern (register/unregister/subscribe) is the
template future feature surfaces follow.

Shell state (sidebar/panel open + size, active view, modal flags) lives in
one Zustand store per the vertical-slice rule, persisted to localStorage
through a Zod schema with fallback-to-defaults on any mismatch.

### Shared Layer (`src/shared/`)

Cross-cutting utilities, UI primitives, type definitions, and configuration
that two or more features depend on. This layer must never import from
features.

### Persistence Layer

Three independent stores, each optimized for its access pattern:

| Store | Technology   | Purpose                        | Access Pattern    |
| ----- | ------------ | ------------------------------ | ----------------- |
| State | Zustand      | UI state, feature flags, cache | Synchronous, hot  |
| VFS   | Dexie        | Virtual filesystem (IndexedDB) | Async, bulk I/O   |
| Prefs | localStorage | User preferences, themes       | Synchronous, cold |

### Worker Layer

Long-running or CPU-intensive operations run in Web Workers to keep the
UI thread responsive:

- **Git worker**: isomorphic-git operations (clone, commit, diff).
- **AI worker**: streaming inference, prompt construction, context management.

## Data Flow Rules

1. **Unidirectional.** User action → Store action → Side effect → State
   update → UI re-render. No circular data flows.
2. **No direct fetch in components.** Components dispatch store actions.
   Stores manage async operations and expose derived state.
3. **Zod at boundaries.** Every external input (network response, localStorage
   read, IndexedDB query result) is validated with Zod before entering the
   store.
4. **Optimistic updates.** UI reflects the expected state immediately.
   Rollback occurs on failure. No spinners for local mutations.

## Persistence Strategy — Local-First VFS

The virtual filesystem uses **Dexie** (IndexedDB wrapper) to provide a
POSIX-like API over the browser's IndexedDB. This gives us:

- **Offline-first.** All files persist across browser sessions with no
  server dependency.
- **Transactional.** Dexie inherits IndexedDB's transactional semantics.
- **Queryable.** IndexedDB indexes enable fast glob, search, and metadata
  queries.
- **Quotable.** Browser storage quotas (typically 50%+ of disk) are
  generous for code.

File content is stored inline on the node row — `string` for utf-8 text,
`Blob` for binary — while metadata (parent link, name, size, timestamps)
lives on the same row so `stat`/`list` never materialise content. The shape
is decided in [ADR 0006](adr/0006-vfs-schema.md).

### File System Layer (`src/features/fs/`)

The virtual file system is a vertical slice: every other feature reads and
writes files **only** through the VFS API surface, never raw Dexie tables.

```
┌────────────────────────────────────────────────────────────────────┐
│  UI (shell sidebar → files view, status bar, shortcuts dialog)     │
│  Components dispatch fs-store actions and subscribe to liveQuery   │
└───────────────────────────┬────────────────────────────────────────┘
                            │ store actions + liveQuery updates
┌───────────────────────────▼────────────────────────────────────────┐
│  fs-store (Zustand, `forge.fs.v1`)                                 │
│  current workspace id (persisted), import progress, orchestration  │
└───────────────────────────┬────────────────────────────────────────┘
                            │ typed calls
┌───────────────────────────▼────────────────────────────────────────┐
│  VFS API (api/vfs.ts) — the only public write path                 │
│  createFile/createDirectory/readFile/writeFile/listChildren/stat/  │
│  exists/rename/move/deleteNode/getPath                             │
│  Zod boundary: every write and every read is validated             │
└───────────────────────────┬────────────────────────────────────────┘
                            │ Dexie transactions
┌───────────────────────────▼────────────────────────────────────────┐
│  Dexie db (api/db.ts) → IndexedDB                                  │
│  workspaces: id, name, createdAt                                   │
│  nodes: id, workspaceId, parentId, name, type, content, mimeType,  │
│         size, createdAt, updatedAt  — idx [workspaceId+parentId]   │
└────────────────────────────────────────────────────────────────────┘

  Side-channel import path (NOT the primary VFS write route):
  File System Access bridge (api/fs-access.ts)
    └── showDirectoryPicker() → recursive per-file import into a new
        workspace (binary sniff, >2MB skip report, progress callback)
```

The File System Access bridge is the one place raw browser filesystem
handles enter the product; everything it reads is written through the VFS
API and validated by the same Zod-boundary rules as user-typed writes.

### File System Non-Goals (current phase)

- **No cross-tab sync.** IndexedDB is origin-scoped; two tabs do not
  coordinate. Later phase.
- **No version history.** Writes overwrite in place; snapshots/undo arrive
  with a later phase.
- **No tree UI.** The files view today renders the workspace root listing
  only; expansion, drag-and-drop, and search are future prompts.
- **No editor/terminal.** The VFS persists; opening and editing files are
  later phases that consume it.

### Why Local-First

- **Privacy.** User code never leaves their machine without explicit action.
- **Speed.** Zero network round-trips for file operations. Sub-millisecond
  reads for cached files.
- **Reliability.** No outages, no rate limits, no subscription dependency.
- **Offline.** Works on planes, in rural areas, with spotty connections.
- **Data sovereignty.** The user owns their workspace entirely.

## Build & Deploy

- **Next.js App Router** with static export for the client shell.
- **Service Worker** (Workbox) for offline caching of static assets.
- **CDN deployment** (Vercel/Cloudflare) for global edge delivery.
- **No server runtime.** The entire application is static files.

## Security Model

- All code execution is sandboxed to the browser context.
- AI API keys are stored in memory only, never persisted.
- IndexedDB is origin-scoped — no cross-origin data leakage.
- CSP headers enforce script source restrictions.
- No `eval()` or `new Function()` in production code.
