# ADR 0002: Local-First Persistence with Dexie (IndexedDB)

## Status

Accepted

## Date

2026-09-16

## Context

FORGE requires a persistent virtual filesystem that survives browser restarts,
works offline, and handles thousands of files with fast read/write access.
This is the core persistence layer — if it fails, the product fails.

Options considered:

1. Server-backed filesystem (cloud storage API)
2. localStorage / sessionStorage
3. IndexedDB directly
4. IndexedDB via Dexie wrapper
5. OPFS (Origin Private File System)
6. Cloudflare Durable Objects / CRDT-based sync

## Decision

We will use **Dexie.js** (typed IndexedDB wrapper) as the primary persistence
layer for the virtual filesystem and all structured data.

### Rationale

1. **IndexedDB is the only viable browser storage for large data.**
   localStorage is limited to ~5-10MB and synchronous. IndexedDB offers
   gigabytes (typically 50%+ of disk) with async, transactional access.

2. **Dexie eliminates IndexedDB's painful API.** Raw IndexedDB requires
   verbose callback-based code, manual versioning, and transaction
   management. Dexie provides a promise-based API, TypeScript-first
   schema definitions, compound indexes, and elegant migrations.

3. **Local-first aligns with our privacy pillar.** Code never leaves the
   browser. No server dependency for basic operation. No subscription
   required for file access.

4. **Battle-tested at scale.** Dexie is used by Firefox (internal storage),
   Thousands of production apps. IndexedDB is supported by every modern
   browser with consistent behavior.

5. **Incremental sync-ready.** Dexie's schema versioning and `liveQuery`
   make it straightforward to add CRDT-based sync in a future version
   without changing the storage layer.

## Consequences

### Positive

- Sub-millisecond reads for individual files (IndexedDB is fast for
  key-value lookups).
- Transactional writes prevent corruption on browser crashes.
- `liveQuery` provides reactive data binding to IndexedDB changes —
  Zustand stores can subscribe to filesystem state changes.
- Dexie addons (dexie-react-hooks, dexie-cloud) provide upgrade paths.

### Negative

- IndexedDB is async-only. Every file read requires `await`, which
  complicates synchronous code paths. We mitigate with optimistic caching
  in Zustand stores.
- Storage quotas are browser-managed and not guaranteed. A user with a
  very large project may hit limits. We must surface quota usage.
- IndexedDB is not accessible from Web Workers in all browsers. File
  operations that must run in workers need a message-passing bridge.
- No built-in conflict resolution. Multi-device sync (future) requires
  CRDT integration.

## Alternatives Considered

### Raw IndexedDB

- **Pros:** No dependency, full control.
- **Cons:** Extremely verbose API, manual schema versioning, easy to
  introduce bugs in transaction handling. Not viable at team scale.

### localStorage

- **Pros:** Synchronous, simple API.
- **Cons:** 5-10MB limit, blocks main thread, no indexing, string-only.
  Cannot store a real filesystem.

### OPFS (Origin Private File System)

- **Pros:** True file API, better performance for large files, synchronous
  access in workers.
- **Cons:** Limited browser support (Firefox lagging), no built-in
  querying/indexing, no TypeScript ecosystem. Too immature for v1.

### Cloudflare Durable Objects / CRDT (Yjs, Automerge)

- **Pros:** Real-time sync, conflict resolution, multiplayer editing.
- **Cons:** Requires server infrastructure, ongoing costs, complexity
  inappropriate for v1. We will revisit for v2 collaboration features.

### Verdict

Dexie over IndexedDB is the pragmatic choice: it gives us a powerful,
well-tested storage layer today while preserving upgrade paths for sync
and collaboration tomorrow.
