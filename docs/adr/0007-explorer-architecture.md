# ADR 0007: Explorer Rendering — Flattened Visible Rows Over Recursive Components

## Status

Accepted

## Date

2026-09-17

## Context

The files view must grow from a flat root listing into a real file explorer:
a lazy, expandable directory tree with inline create/rename, context menus,
native drag-and-drop moves, full keyboard operation (incl. type-ahead), and a
read-only file preview. The tree can span thousands of nodes, so windowed
(e.g. `@tanstack/react-virtual`) rendering is required — the virtualized
primitive range over a _linear_ list, not a nested tree.

The VFS already ships the raw material: `listChildren` returns one
directory's children, and every node carries a `parentId` link. Two candidate
architectures present themselves:

**A. Recursive nesting.** Render `Tree` → for each directory, render children
`Tree`s. Expand state lives implicitly in which children were rendered.
Keyboard navigation needs DOM traversal — find next/previous focusable
element — which is index-free and order-preserving only by accident.

**B. Flattened visible rows.** Relationally enumerate every currently-visible
node into a flat `VisibleRow[]` (walking only expanded directories), render
it as one virtualized list, and drive navigation, selection, drops, and
type-ahead by _row index_.

## Decision

Use the **flattened visible-row list** (B): a pure `flattenTree` function
turns `(allNodes, expandedIds, creatingIntent)` into an ordered
`VisibleRow[]` of `{ node, depth }` entries, and the tree renders that list
through one windowed container. All interaction logic — `keyNav`,
`nextTypeAhead`, `resolveDrop`, `validateName` — is pure, index- and
id-based, and testable without DOM. Non-visual explorer state (expanded set,
selection, focus, rename/create context, drop target) lives in a dedicated
non-persisted Zustand store, `explorer-store`.

Rows are 22px and virtualized; the create-edit row participates in the same
list so it inherits windowing (it may exceed 22px while an error message is
shown, handled by dynamic measurement).

### Rationale

1. **Virtualization wants a list.** `useVirtualizer` consumes `count` +
   indexable rows. A recursive tree cannot hand it a flat contract without
   first doing exactly what `flattenTree` does.
2. **Keyboard nav becomes arithmetic.** Up/Down = index ± 1; Left/Right =
   read `expandedIds` + `parentId`. There is no DOM walking, so ordering is
   always the source of truth, selection is never lost to re-renders.
3. **Drop targeting is a pure decision.** Resolving drop position against a
   NodeList/ancestor map in `resolveDrop` is fully unit-testable — cycle,
   self, and sibling-name-clash rejections are asserted without a browser.
4. **Indices are guaranteed.** A flat list has a total order; `aria-level`,
   `aria-expanded`, insert-position math, and the Draft spec's
   single-ancestor expansion rule all derive from one structure.
5. **Lazy loading stays honest.** `flattenTree` walks a directory only when
   `expandedIds` says so; children of closed directories are never
   enumerated, preserving the VFS lazy-load contract.

### Negative consequences

- Tree mutations or expansion changes recompute the full visible row list.
  With ≤ thousands of visible rows and memoisation on `(nodes, expandedIds)`
  this is negligible; the heavy per-node cost (content blobs) never enters
  the list because read paths already exclude content.
- The recursive alternative would have needed no flatten step, at the price
  of un-windowed DOM and index-free navigation that cannot satisfy the
  keyboard/drag requirements.

## Consequences

### Reader flow

```
fs-store (current workspace, listing revision, mutations)
   │  liveQuery (workspace-wide, Dexie) — the only reactive read
   ▼
useWorkspaceNodes → FileNode[]
   │
   ▼
flattenTree(nodes, expandedIds, creatingIntent) → VisibleRow[]   [pure]
   │  + keyNav / nextTypeAhead / resolveDrop / validateName      [pure]
   ▼
FileTree (windowed list, store-driven keyboard/selection/dnd)
   │
   ▼
preview-pane (1 selected file) → readFile via VFS, read-only render
```

### Store boundaries

- `explorer-store` is **UI-only**: expanded/selected/focused/rename/create/
  drop state. It is deliberately not persisted — expansion and selection are
  session state, unlike the workspace id which stays in `fs-store`.
- Every mutation (create/rename/move/delete) goes through `fs-store` actions
  that call the VFS API and bump a `listingRevision` counter. The counter
  re-triggers the workspace-wide liveQuery, which is the single reactive
  primitive for re-rendering the tree (per-directory queries cannot be
  dynamic).

### UI notes

- Indentation + hierarchy guides are pure CSS from `depth`.
- Every row carries `role=treeitem`; the virtualized scroll viewport is the
  `role=tree`. Roving focus follows the focused id.
- Drop resolves via `resolveDrop` on every `dragover`; invalid drops show the
  native `not-allowed` cursor and never navigate.
- Preview is read-only by design this phase; editing is a later prompt.

## Alternatives Considered

### Nested recursive components (A)

- **Pros:** conceptually direct; expand is "render children or not".
- **Cons:** no windowing (thousands of DOM nodes on a big workspace);
  keyboard nav = DOM traversal with no stable index (breaks type-ahead and
  range selection); drop targeting must parse layout instead of resolving a
  parent; expand/collapse correctness depends on per-level hidden state.
  Satisfies the visual requirement but fails every interaction requirement.

### Fully persisted per-directory liveQueries

- **Pros:** each directory subscribes to exactly its children; updates are
  narrow.
- **Cons:** the subscription set must mirror `expandedIds` and re-subscribe on
  every expand/collapse, defeating Dexie's liveQuery deduping and complicating
  tests; the UI then owns query wiring, which the vertical-slice rules forbid.
  One workspace-wide query is simpler, de-duped once, and — with the
  revision counter compensating for `fake-indexeddb`'s lack of change
  events — behaves identically in production and tests.

## Verdict

The flattened-row architecture converts every hard interactive problem
(keyboard, dnd, windowing, type-ahead) into pure list math. It is the only
option that meets the explorer requirements while keeping the VFS read path
and feed strictness rules intact.
