// VFS API — the only public write path to persisted workspaces; zod-validated at every boundary
import { z } from "zod";

import {
  db,
  newNodeId,
  type NodeRecord,
  nodeSchema,
  type NodeType,
  ROOT_PARENT,
  type StoredCell,
  type StoredContent,
  type WorkspaceRecord,
  workspaceSchema,
} from "./db";

export type VfsErrorCode =
  "not-found" | "exists" | "invalid" | "cycle" | "not-a-file" | "not-a-directory";

export class VfsError extends Error {
  readonly code: VfsErrorCode;
  constructor(code: VfsErrorCode, message: string) {
    super(message);
    this.name = "VfsError";
    this.code = code;
  }
}

function parseBoundary<T>(schema: z.ZodType<T>, value: unknown, label: string): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    const detail = result.error.issues[0]?.message ?? "invalid input";
    throw new VfsError("invalid", `${label}: ${detail}`);
  }
  return result.data;
}

export type FileNode = Omit<NodeRecord, "content">;
export type WorkspaceMeta = z.infer<typeof workspaceSchema>;

const workspaceInputSchema = z.object({
  id: z.string().min(1).max(128).optional(),
  name: z.string().min(1).max(255),
});

const nodeCreateSchema = z.object({
  workspaceId: z.string().min(1),
  parentId: z.string().nullable(),
  name: nodeSchema.shape.name,
});

const writeContentSchema = z.union([
  z.string(),
  z.custom<Blob>((value) => value instanceof Blob),
]);

const parentIdSchema = z.string().nullable();

function nameTaken(parents: readonly NodeRecord[], name: string): boolean {
  return parents.some((node) => node.name === name);
}

function nowIso(): string {
  return new Date().toISOString();
}

// Converts the public "root is null" parent to the stored "" sentinel.
function toStoredParent(parentId: string | null): string {
  return parentId ?? ROOT_PARENT;
}

export function byteLength(content: StoredContent): number {
  if (typeof content === "string") return new TextEncoder().encode(content).byteLength;
  return content.size;
}

// Blobs are cloned into an ArrayBuffer for storage; strings pass through.
async function toStoredCell(content: StoredContent): Promise<StoredCell> {
  if (typeof content === "string") return content;
  return content.arrayBuffer();
}

function fileNode(record: NodeRecord): FileNode {
  const rest: FileNode = { ...record };
  return rest;
}

function recordFromRow(row: unknown, kind: string): NodeRecord {
  const parsed = nodeSchema.safeParse(row);
  if (!parsed.success)
    throw new VfsError("invalid", `Stored ${kind} row failed validation`);
  return parsed.data;
}

async function mustGetNode(id: string): Promise<NodeRecord> {
  const row = await db.nodes.get(id);
  if (row === undefined) throw new VfsError("not-found", `Node "${id}" does not exist`);
  return recordFromRow(row, "node");
}

async function mustGetWorkspace(id: string): Promise<WorkspaceRecord> {
  const row = await db.workspaces.get(id);
  if (row === undefined) {
    throw new VfsError("not-found", `Workspace "${id}" does not exist`);
  }
  const parsed = workspaceSchema.safeParse(row);
  if (!parsed.success)
    throw new VfsError("invalid", "Stored workspace row failed validation");
  return parsed.data;
}

// IndexedDB only indexes rows whose keyPath components are valid keys, so the
// stored parent is always a string (ROOT_PARENT for workspace roots).
function childrenKey(workspaceId: string, parentId: string) {
  return [workspaceId, parentId] as const;
}

async function listSiblings(
  workspaceId: string,
  parentId: string,
): Promise<NodeRecord[]> {
  const rows = await db.nodes
    .where("[workspaceId+parentId]")
    .equals(childrenKey(workspaceId, parentId))
    .toArray();
  const siblings: NodeRecord[] = [];
  for (const row of rows) siblings.push(recordFromRow(row, "node"));
  return siblings;
}

async function assertParentOk(workspaceId: string, parentId: string): Promise<void> {
  if (parentId === ROOT_PARENT) return;
  const parent = await mustGetNode(parentId);
  if (parent.workspaceId !== workspaceId) {
    throw new VfsError("invalid", "Parent node lives in a different workspace");
  }
  if (parent.type !== "directory") {
    throw new VfsError("not-a-directory", "Parent node is not a directory");
  }
}

function assertUniqueName(
  workspaceId: string,
  parentId: string,
  name: string,
): Promise<void> {
  return listSiblings(workspaceId, parentId).then((siblings) => {
    if (nameTaken(siblings, name)) {
      throw new VfsError("exists", `A node named "${name}" already exists here`);
    }
  });
}

// Walks ancestors from `fromId`, returning true if `targetId` is ever reached.
async function reachesAncestor(fromId: string, targetId: string): Promise<boolean> {
  let cursor = fromId;
  for (let depth = 0; depth < 512; depth += 1) {
    const node = await db.nodes.get(cursor);
    if (node === undefined) return false;
    if (node.id === targetId) return true;
    if (node.parentId === ROOT_PARENT) return false;
    cursor = node.parentId;
  }
  return false;
}

async function collectSubtreeIds(workspaceId: string, rootId: string): Promise<string[]> {
  const ids: string[] = [rootId];
  let frontier = [rootId];
  for (let depth = 0; depth < 512 && frontier.length > 0; depth += 1) {
    const children: string[] = [];
    for (const parentId of frontier) {
      const rows = await db.nodes
        .where("[workspaceId+parentId]")
        .equals(childrenKey(workspaceId, parentId))
        .toArray();
      for (const row of rows) {
        children.push(row.id);
        ids.push(row.id);
      }
    }
    frontier = children;
  }
  return ids;
}

function createNode(input: {
  workspaceId: string;
  parentId: string;
  name: string;
  type: NodeType;
}): NodeRecord {
  const now = nowIso();
  return {
    id: newNodeId(),
    workspaceId: input.workspaceId,
    parentId: input.parentId,
    name: input.name,
    type: input.type,
    mimeType: null,
    size: 0,
    content: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function createVfs() {
  async function createWorkspace(input: {
    id?: string;
    name: string;
  }): Promise<WorkspaceMeta> {
    const parsed = parseBoundary(workspaceInputSchema, input, "Invalid workspace");
    const existing = await db.workspaces.get(parsed.id ?? "");
    if (existing !== undefined) return fileWorkspace(existing);
    const record: WorkspaceRecord = {
      id: parsed.id ?? newNodeId(),
      name: parsed.name,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    await db.workspaces.add(record);
    return fileWorkspace(record);
  }

  function fileWorkspace(row: WorkspaceRecord): WorkspaceMeta {
    const parsed = workspaceSchema.parse(row);
    return parsed;
  }

  async function getWorkspace(id: string): Promise<WorkspaceMeta | null> {
    const row = await db.workspaces.get(id);
    if (row === undefined) return null;
    return fileWorkspace(row);
  }

  async function createDirectory(input: {
    workspaceId: string;
    parentId: string | null;
    name: string;
  }): Promise<FileNode> {
    const parsed = parseBoundary(nodeCreateSchema, input, "Invalid directory");
    const parentId = toStoredParent(parsed.parentId);
    await mustGetWorkspace(parsed.workspaceId);
    await assertParentOk(parsed.workspaceId, parentId);
    await assertUniqueName(parsed.workspaceId, parentId, parsed.name);
    const record = createNode({
      workspaceId: parsed.workspaceId,
      parentId,
      name: parsed.name,
      type: "directory",
    });
    await db.nodes.add(record);
    return fileNode(record);
  }

  async function createFile(input: {
    workspaceId: string;
    parentId: string | null;
    name: string;
    content: StoredContent;
    mimeType?: string | undefined;
  }): Promise<FileNode> {
    const parsedContent = parseBoundary(
      writeContentSchema,
      input.content,
      "Invalid content",
    );
    const parsed = parseBoundary(nodeCreateSchema, input, "Invalid file");
    const parentId = toStoredParent(parsed.parentId);
    await mustGetWorkspace(parsed.workspaceId);
    await assertParentOk(parsed.workspaceId, parentId);
    await assertUniqueName(parsed.workspaceId, parentId, parsed.name);
    const record = createNode({
      workspaceId: parsed.workspaceId,
      parentId,
      name: parsed.name,
      type: "file",
    });
    record.content = await toStoredCell(parsedContent);
    record.size = byteLength(parsedContent);
    record.mimeType = input.mimeType ?? null;
    await db.nodes.add(record);
    return fileNode(record);
  }

  async function readFile(id: string): Promise<StoredContent> {
    const node = await mustGetNode(id);
    if (node.type !== "file")
      throw new VfsError("not-a-file", `Node "${id}" is not a file`);
    if (node.content === null)
      throw new VfsError("invalid", `Node "${id}" has no content`);
    if (typeof node.content === "string") return node.content;
    return new Blob(
      [new Uint8Array(node.content)],
      node.mimeType === null ? {} : { type: node.mimeType },
    );
  }

  async function writeFile(
    id: string,
    content: StoredContent,
    mimeType?: string,
  ): Promise<FileNode> {
    const parsedContent = parseBoundary(writeContentSchema, content, "Invalid content");
    const node = await mustGetNode(id);
    if (node.type !== "file")
      throw new VfsError("not-a-file", `Node "${id}" is not a file`);
    const updated: NodeRecord = {
      ...node,
      content: await toStoredCell(parsedContent),
      size: byteLength(parsedContent),
      mimeType: mimeType ?? node.mimeType,
      updatedAt: nowIso(),
    };
    await db.nodes.put(updated);
    return fileNode(updated);
  }

  async function listChildren(
    workspaceId: string,
    parentId: string | null,
  ): Promise<FileNode[]> {
    const siblings = await listSiblings(workspaceId, toStoredParent(parentId));
    return siblings.map(fileNode).sort((a, b) => {
      if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
      return a.name.localeCompare(b.name, "en", { sensitivity: "base" });
    });
  }

  // Returns every node of a workspace (dirs-first sort preserved for depth-0
  // rows) so the explorer can derive the visible tree from one liveQuery.
  async function listWorkspaceNodes(workspaceId: string): Promise<FileNode[]> {
    await mustGetWorkspace(workspaceId);
    const rows = await db.nodes
      .where("[workspaceId+parentId]")
      .aboveOrEqual([workspaceId, ROOT_PARENT])
      .toArray();
    const nodes: FileNode[] = [];
    for (const row of rows) {
      if (row.workspaceId !== workspaceId) continue;
      nodes.push(fileNode(recordFromRow(row, "node")));
    }
    return nodes;
  }

  async function stat(id: string): Promise<FileNode | null> {
    const row = await db.nodes.get(id);
    if (row === undefined) return null;
    return fileNode(recordFromRow(row, "node"));
  }

  async function exists(id: string): Promise<boolean> {
    return (await db.nodes.get(id)) !== undefined;
  }

  async function getPath(id: string): Promise<string> {
    const names: string[] = [];
    let cursor = id;
    for (let depth = 0; depth < 512; depth += 1) {
      if (cursor === ROOT_PARENT) break;
      const node = await mustGetNode(cursor);
      names.unshift(node.name);
      cursor = node.parentId;
    }
    return `/${names.join("/")}`;
  }

  async function rename(id: string, newName: string): Promise<FileNode> {
    const node = await mustGetNode(id);
    const parsedName = parseBoundary(nodeSchema.shape.name, newName, "Invalid name");
    const siblings = await listSiblings(node.workspaceId, node.parentId);
    if (siblings.some((sibling) => sibling.id !== id && sibling.name === parsedName)) {
      throw new VfsError("exists", `A node named "${parsedName}" already exists here`);
    }
    const updated: NodeRecord = { ...node, name: parsedName, updatedAt: nowIso() };
    await db.nodes.put(updated);
    return fileNode(updated);
  }

  async function move(id: string, newParentId: string | null): Promise<FileNode> {
    const node = await mustGetNode(id);
    const parsedParent = parseBoundary(parentIdSchema, newParentId, "Invalid parent");
    const storedParent = toStoredParent(parsedParent);
    if (storedParent === id)
      throw new VfsError("cycle", "Cannot move a node into itself");
    await assertParentOk(node.workspaceId, storedParent);
    if (storedParent !== ROOT_PARENT && (await reachesAncestor(storedParent, id))) {
      throw new VfsError("cycle", "Cannot move a node into one of its descendants");
    }
    const siblings = await listSiblings(node.workspaceId, storedParent);
    if (siblings.some((sibling) => sibling.id !== id && sibling.name === node.name)) {
      throw new VfsError(
        "exists",
        `A node named "${node.name}" already exists at the target`,
      );
    }
    const updated: NodeRecord = { ...node, parentId: storedParent, updatedAt: nowIso() };
    await db.nodes.put(updated);
    return fileNode(updated);
  }

  async function deleteNode(id: string): Promise<void> {
    const node = await mustGetNode(id);
    const subtree = await collectSubtreeIds(node.workspaceId, id);
    await db.transaction("rw", db.nodes, async () => {
      await db.nodes.bulkDelete(subtree);
    });
  }

  return {
    byteLength,
    createDirectory,
    createFile,
    createWorkspace,
    deleteNode,
    exists,
    getPath,
    getWorkspace,
    listChildren,
    listWorkspaceNodes,
    move,
    readFile,
    rename,
    stat,
    writeFile,
  } as const;
}

export type VfsApi = ReturnType<typeof createVfs>;

export const vfs = createVfs();

function isVfsLike(value: unknown): value is VfsApi {
  return typeof value === "object" && value !== null && "createWorkspace" in value;
}

export function coerceVfs(vfsLike: unknown): VfsApi {
  if (isVfsLike(vfsLike)) return vfsLike;
  return vfs;
}
