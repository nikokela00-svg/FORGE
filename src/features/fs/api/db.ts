// Dexie schema for the FORGE virtual file system — adjacency list over path keys (ADR 0006)
import Dexie, { type EntityTable } from "dexie";
import { z } from "zod";

export const NODE_TYPES = ["file", "directory"] as const;
export type NodeType = (typeof NODE_TYPES)[number];
export type ParentId = string | null;
// Public write/read content: plain text or structured-cloneable binary.
export type StoredContent = string | Blob;
// Persisted cell: binary is stored as ArrayBuffer because IndexedDB cannot
// round-trip Blob instances through fake-indexeddb-and-strict clones.
export type StoredCell = string | ArrayBuffer;

// The empty string is the stored sentinel for "workspace root": null is not a
// valid IndexedDB key part, so null parents can never be queried through the
// compound [workspaceId+parentId] index (real IDB silently drops the row).
export const ROOT_PARENT = "";

export interface NodeRecord {
  id: string;
  workspaceId: string;
  parentId: string;
  name: string;
  type: NodeType;
  mimeType: string | null;
  size: number;
  content: StoredCell | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceRecord {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

const nameSchema = z
  .string()
  .min(1)
  .max(255)
  .refine((name) => !/[\\/]/.test(name) && name !== "." && name !== "..", {
    message: "Invalid node name",
  });

export const nodeSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  parentId: z.string(),
  name: nameSchema,
  type: z.enum(NODE_TYPES),
  mimeType: z.string().nullable(),
  size: z.number().int().nonnegative(),
  content: z.union([z.string(), z.custom<ArrayBuffer>(isArrayBuffer)]).nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const workspaceSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(255),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Brand check instead of instanceof: fake-indexeddb clones values into a
// different realm, where instanceof against the global ArrayBuffer fails.
function isArrayBuffer(value: unknown): value is ArrayBuffer {
  return Object.prototype.toString.call(value) === "[object ArrayBuffer]";
}

export type ParsedNode = z.infer<typeof nodeSchema>;
export type ParsedWorkspace = z.infer<typeof workspaceSchema>;

class ForgeDatabase extends Dexie {
  workspaces!: EntityTable<WorkspaceRecord, "id">;
  nodes!: EntityTable<NodeRecord, "id">;

  constructor() {
    super("forge");
    this.version(1).stores({
      workspaces: "id, name, createdAt",
      nodes: "id, name, [workspaceId+parentId], [workspaceId+type]",
    });
  }
}

export function createDatabase(): ForgeDatabase {
  return new ForgeDatabase();
}

export const db = createDatabase();

export function newNodeId(): string {
  return crypto.randomUUID();
}
