# ADR 0006: VFS Schema — Adjacency List Over Path Keys

## Status

Accepted

## Date

2026-09-16

## Context

FORGE's virtual file system (VFS) persists every workspace in IndexedDB via
Dexie. The core storage question is how a directory tree is modelled: each
node either stores an explicit parent link, or stores its full virtual path
and relies on string prefixing to reconstruct hierarchy.

The schema must serve the operations the VFS already commits to:

- **Move semantics** — `move(node, newParent)` must be a single record
  update, not a recursive rewrite of every descendant's key.
- **Integrity** — a directory must not be moved into its own subtree
  (cycle), and sibling names must be unique per parent.
- **Indexing** — `listChildren(parent)` must be a single index lookup;
  `getPath(node)` must be cheap enough for the sidebar/status bar.
- **Recursive delete** — deleting a folder must reliably remove every
  descendant without range-scan surprises.

## Decision

Use an **adjacency-list nodes table**: every node stores `id`,
`workspaceId`, `parentId` (`null` = workspace root), `name`, plus content and
metadata. Tree shape is expressed through `parentId` links; the _virtual
path_ (`src/app/main.ts`) is derived, never stored.

Composite index `[workspaceId+parentId]` serves both "all nodes in a
workspace" and "children of a given parent" with one lookup; a `name` index
is reserved for later glob/search.

### Rationale

1. **`move` is O(1).** Reparenting a subtree updates a single `parentId`
   column. Path-keyed storage would rewrite the key (and often the index
   entry) of every descendant — for a tree of n nodes that is O(n) writes
   in the worst case, and the commit cost scales with subtree depth instead
   of staying flat.

2. **Cycles are cheap to reject.** `move` walks ancestors from the target
   parent up to root until it finds the source id (`not-found`) or hits
   root — at most tree-depth reads, no path-string parsing.

3. **Identity survives renames.** A node's `id` is immutable; `getPath`
   walks the `parentId` chain. Renaming an intermediate directory changes
   nothing but that node's `name`, so every ancestor of it automatically
   resolves to the right path. Path-keyed records would make a directory
   rename a full-subtree re-key.

4. **IndexedDB is value-store oriented.** Compound index lookups over two
   concrete fields are the engine's native strength; string-prefix range
   scans over path keys (with escaping of `/` in names) are error-prone and
   rely on collation details that differ across browsers.

5. **Parent uniqueness is enforceable.** The composite index
   `[workspaceId+parentId]` + a size/name check in the transaction is
   enough to reject duplicate sibling names before insert.

### Negative consequences

- `getPath` is O(depth) reads rather than O(1). Depth is bounded for
  developer workspaces and the result is memoised per workspace in the
  store, so this is a non-issue.
- Root is implicit (`parentId = null`), not a real node — code must treat
  `null` as "workspace root" everywhere. This is captured by the VFS types
  (`ParentId = string | null`).

## Consequences

### Positive

- All tree operations (`create`, `rename`, `move`, recursive `delete`,
  `listChildren`) are index-backed and bounded.
- Schema v1 is small and additive; later phases (history, cross-tab sync)
  can add tables/columns without reshaping this one.
- One table models files and directories; content lives inline on the row
  (`string` for utf-8, `Blob` for binary), keeping reads trade-offs simple:
  `stat`/`list` never materialise content blobs.

### Negative

- Path derivation is recursive (see above) — bounded and amortised by
  memoisation.
- Deleting a directory requires an explicit descendant walk rather than a
  key-prefix delete. In Dexie this is a single transaction iterating the
  `[workspaceId+parentId]` index, which is still one round-trip per level.

## Alternatives Considered

### Path-keyed records (`id = "/a/b/c"`)

- **Pros:** `getPath` and root listing are string filters; no recursion.
- **Cons:** Moves/renames of ancestors rewrite all descendants; sibling
  uniqueness needs prefix parsing; `/` must be disallowed (or escaped) in
  names; cycle checks require path-string analysis. Each of these is a
  correctness trap the adjacency list simply does not have.

### Document-per-tree (whole workspace as one record)

- **Pros:** atomic workspace snapshot; trivial export.
- **Cons:** every mutation rewrites the entire tree (pathological for any
  real project); no incremental indexing; concurrency within a workspace
  is impossible to reason about.

### Verdict

The adjacency list is the only option that keeps `move` O(1), keeps cycle
rejection simple, and lets IndexedDB's own indexes do the querying — it wins
the three-way trade for a local-first product where workspace trees grow to
thousands of nodes.
