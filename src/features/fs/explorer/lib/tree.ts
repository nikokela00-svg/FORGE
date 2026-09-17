// Pure, DOM-free tree math for the explorer — flattening, drops, names, keyboard, type-ahead
import { type NodeType, ROOT_PARENT } from "../../api/db";
import type { FileNode } from "../../api/vfs";

export type DropPosition = "before" | "after" | "inside";

export interface CreateIntent {
  parentId: string;
  type: NodeType;
}

export interface NodeRow {
  kind: "node";
  node: FileNode;
  depth: number;
}

export interface CreateRow {
  kind: "create";
  parentId: string;
  type: NodeType;
  depth: number;
}

export type VisibleRow = NodeRow | CreateRow;

export function rowKey(row: VisibleRow): string {
  return row.kind === "node" ? row.node.id : `create:${row.parentId}:${row.type}`;
}

function compareNodes(a: FileNode, b: FileNode): number {
  if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
  return a.name.localeCompare(b.name, "en", { sensitivity: "base" });
}

// Where a just-created row belongs: the empty name sorts first within its own
// type group, and directories always sort ahead of files.
function createInsertionIndex(children: readonly FileNode[], type: NodeType): number {
  if (type === "directory") return 0;
  let directories = 0;
  for (const child of children) {
    if (child.type === "directory") directories += 1;
  }
  return directories;
}

// Workspace-wide helpers for TreeWrapper; root children key on the stored sentinel.
function indexNodes(nodes: readonly FileNode[]): {
  childrenOf: Map<string, FileNode[]>;
  byId: Map<string, FileNode>;
} {
  const childrenOf = new Map<string, FileNode[]>();
  const byId = new Map<string, FileNode>();
  for (const node of nodes) {
    byId.set(node.id, node);
    const list = childrenOf.get(node.parentId);
    if (list === undefined) {
      childrenOf.set(node.parentId, [node]);
    } else {
      list.push(node);
    }
  }
  for (const list of childrenOf.values()) list.sort(compareNodes);
  return { childrenOf, byId };
}

export function flattenTree(
  nodes: readonly FileNode[],
  expandedIds: ReadonlySet<string>,
  createIntent: CreateIntent | null = null,
): VisibleRow[] {
  const { childrenOf } = indexNodes(nodes);
  const rows: VisibleRow[] = [];

  function enumerate(parentId: string, depth: number): void {
    const children = childrenOf.get(parentId);
    const count = children?.length ?? 0;
    const insertAt =
      createIntent !== null && createIntent.parentId === parentId
        ? createInsertionIndex(children ?? [], createIntent.type)
        : -1;
    for (let index = 0; index < count; index += 1) {
      if (index === insertAt) {
        rows.push({
          kind: "create",
          parentId,
          type: createIntent?.type ?? "file",
          depth,
        });
      }
      const child = children?.[index];
      if (child !== undefined) {
        rows.push({ kind: "node", node: child, depth });
        if (child.type === "directory" && expandedIds.has(child.id)) {
          enumerate(child.id, depth + 1);
        }
      }
    }
    if (insertAt === count) {
      rows.push({
        kind: "create",
        parentId,
        type: createIntent?.type ?? "file",
        depth,
      });
    }
  }

  enumerate(ROOT_PARENT, 0);
  return rows;
}

export type DropResolution =
  | { ok: true; parentId: string }
  | {
      ok: false;
      reason: "self" | "cycle" | "sibling-name-clash" | "not-a-directory" | "unknown";
    };

// Pure drop decision: resolves `ids` to a destination parent or the precise
// reason a drop must be rejected, mirroring the VFS move invariants.
export function resolveDrop(
  dragIds: readonly string[],
  targetId: string,
  position: DropPosition,
  nodes: readonly FileNode[],
): DropResolution {
  if (dragIds.length === 0) return { ok: false, reason: "unknown" };
  const { byId } = indexNodes(nodes);
  const parents = new Map<string, string>();
  for (const node of nodes) parents.set(node.id, node.parentId);

  if (dragIds.includes(targetId)) return { ok: false, reason: "self" };
  const target = byId.get(targetId);
  if (target === undefined) return { ok: false, reason: "unknown" };

  const newParentId = position === "inside" ? targetId : target.parentId;
  if (position === "inside" && target.type !== "directory") {
    return { ok: false, reason: "not-a-directory" };
  }
  for (const id of dragIds) {
    if (isAncestorOrSelf(id, newParentId, parents)) {
      return { ok: false, reason: "cycle" };
    }
  }

  const targetChildren = nodes.filter(
    (node) => node.parentId === newParentId && !dragIds.includes(node.id),
  );
  const movingNames = new Set<string>();
  for (const id of dragIds) {
    const dragged = byId.get(id);
    if (dragged === undefined) return { ok: false, reason: "unknown" };
    if (movingNames.has(dragged.name)) return { ok: false, reason: "sibling-name-clash" };
    movingNames.add(dragged.name);
    if (targetChildren.some((sibling) => sibling.name === dragged.name)) {
      return { ok: false, reason: "sibling-name-clash" };
    }
  }
  return { ok: true, parentId: newParentId };
}

function isAncestorOrSelf(
  ancestorId: string,
  nodeId: string,
  parents: Map<string, string>,
): boolean {
  if (ancestorId === nodeId) return true;
  let cursor = nodeId;
  let depth = 0;
  while (cursor !== ROOT_PARENT && depth < 512) {
    const parent = parents.get(cursor);
    if (parent === undefined) return false;
    if (parent === ancestorId) return true;
    cursor = parent;
    depth += 1;
  }
  return false;
}

export type NameValidation =
  { ok: true } | { ok: false; reason: "empty" | "illegal-char" | "duplicate-sibling" };

export function validateName(
  name: string,
  siblings: readonly { id: string; name: string }[],
  excludeId: string | null = null,
): NameValidation {
  if (
    name.length > 255 ||
    name !== name.trim() ||
    /[\\/]/.test(name) ||
    name === "." ||
    name === ".."
  ) {
    return { ok: false, reason: "illegal-char" };
  }
  if (name === "") return { ok: false, reason: "empty" };
  if (siblings.some((sibling) => sibling.id !== excludeId && sibling.name === name)) {
    return { ok: false, reason: "duplicate-sibling" };
  }
  return { ok: true };
}

export interface KeyNavResult {
  focusId: string;
  toggle: "expand" | "collapse" | null;
}

export type NavKey = "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight";

// Index-based keyboard navigation over the visible flat list.
export function keyNav(
  rows: readonly VisibleRow[],
  currentId: string,
  key: NavKey,
  expandedIds: ReadonlySet<string>,
): KeyNavResult | null {
  const index = rows.findIndex((row) => row.kind === "node" && row.node.id === currentId);
  if (index === -1) return null;

  if (key === "ArrowUp") {
    const row = previousNodeRow(rows, index);
    return { focusId: row?.node.id ?? currentId, toggle: null };
  }
  if (key === "ArrowDown") {
    const row = nextNodeRow(rows, index);
    return { focusId: row?.node.id ?? currentId, toggle: null };
  }

  const row = rows[index];
  const node = row?.kind === "node" ? row.node : undefined;
  if (node === undefined) return { focusId: currentId, toggle: null };

  if (key === "ArrowLeft") {
    if (node.type === "directory" && expandedIds.has(node.id)) {
      return { focusId: currentId, toggle: "collapse" };
    }
    if (node.parentId !== ROOT_PARENT) {
      return { focusId: node.parentId, toggle: null };
    }
    return { focusId: currentId, toggle: null };
  }

  if (node.type !== "directory") return { focusId: currentId, toggle: null };
  if (!expandedIds.has(node.id)) return { focusId: currentId, toggle: "expand" };
  const firstChild = nextNodeRow(rows, index);
  if (firstChild !== null && firstChild.node.parentId === node.id) {
    return { focusId: firstChild.node.id, toggle: null };
  }
  return { focusId: currentId, toggle: null };
}

function previousNodeRow(rows: readonly VisibleRow[], from: number): NodeRow | null {
  for (let index = from - 1; index >= 0; index -= 1) {
    const row = rows[index];
    if (row?.kind === "node") return row;
  }
  return null;
}

function nextNodeRow(rows: readonly VisibleRow[], from: number): NodeRow | null {
  for (let index = from + 1; index < rows.length; index += 1) {
    const row = rows[index];
    if (row?.kind === "node") return row;
  }
  return null;
}

// Case-insensitive prefix type-ahead: returns the next matching row id, wrapping.
export function nextTypeAhead(
  rows: readonly VisibleRow[],
  currentFocusId: string | null,
  char: string,
): string | null {
  const needle = char.trim().toLocaleLowerCase("en");
  if (needle === "") return null;
  const start =
    currentFocusId === null
      ? 0
      : rows.findIndex((row) => row.kind === "node" && row.node.id === currentFocusId) +
        1;
  if (start < 0) return null;
  for (let offset = 0; offset < rows.length; offset += 1) {
    const row = rows[(start + offset) % rows.length];
    if (row?.kind !== "node") continue;
    if (row.node.name.toLocaleLowerCase("en").startsWith(needle)) return row.node.id;
  }
  return null;
}
