// VFS integration tests against a real Dexie on the fake-indexeddb backend
import { beforeEach, describe, expect, it } from "vitest";

import { db, vfs, VfsError } from "@/features/fs";

async function resetDatabase(): Promise<void> {
  await db.delete();
  await db.open();
}

describe("workspaces", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("creates, reads, and lists a workspace", async () => {
    const workspace = await vfs.createWorkspace({ name: "alpha" });
    expect(workspace.name).toBe("alpha");
    expect(workspace.id.length).toBeGreaterThan(0);

    const fetched = await vfs.getWorkspace(workspace.id);
    expect(fetched?.name).toBe("alpha");
    expect(await vfs.getWorkspace("missing")).toBeNull();
  });

  it("is idempotent for a fixed id and validates names", async () => {
    const first = await vfs.createWorkspace({ id: "fixed", name: "one" });
    const second = await vfs.createWorkspace({ id: "fixed", name: "one" });
    expect(second.id).toBe(first.id);
    await expect(vfs.createWorkspace({ name: "" })).rejects.toBeInstanceOf(VfsError);
  });
});

describe("nodes", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("creates files and directories with correct types and content", async () => {
    const { id: ws } = await vfs.createWorkspace({ name: "project" });
    const dir = await vfs.createDirectory({
      workspaceId: ws,
      parentId: null,
      name: "src",
    });
    const file = await vfs.createFile({
      workspaceId: ws,
      parentId: dir.id,
      name: "main.ts",
      content: 'export const message = "hi";',
    });
    expect(dir.type).toBe("directory");
    expect(file.type).toBe("file");
    expect(file.size).toBe(28);
    expect(await vfs.readFile(file.id)).toBe('export const message = "hi";');
  });

  it("rejects duplicate sibling names with a typed exists error", async () => {
    const { id: ws } = await vfs.createWorkspace({ name: "project" });
    await vfs.createFile({
      workspaceId: ws,
      parentId: null,
      name: "a.txt",
      content: "x",
    });
    await expect(
      vfs.createFile({ workspaceId: ws, parentId: null, name: "a.txt", content: "y" }),
    ).rejects.toMatchObject({ code: "exists" });
  });

  it("rejects invalid names at the zod boundary with a typed invalid error", async () => {
    const { id: ws } = await vfs.createWorkspace({ name: "project" });
    await expect(
      vfs.createFile({ workspaceId: ws, parentId: null, name: "a/b.txt", content: "x" }),
    ).rejects.toMatchObject({ code: "invalid" });
    await expect(
      vfs.createDirectory({ workspaceId: ws, parentId: null, name: ".." }),
    ).rejects.toMatchObject({ code: "invalid" });
  });

  it("rejects files under a file parent and returns stat/exists accurately", async () => {
    const { id: ws } = await vfs.createWorkspace({ name: "project" });
    const file = await vfs.createFile({
      workspaceId: ws,
      parentId: null,
      name: "a.txt",
      content: "x",
    });
    await expect(
      vfs.createFile({ workspaceId: ws, parentId: file.id, name: "b.txt", content: "y" }),
    ).rejects.toMatchObject({ code: "not-a-directory" });
    expect((await vfs.stat(file.id))?.name).toBe("a.txt");
    expect(await vfs.exists(file.id)).toBe(true);
    expect(await vfs.exists("nope")).toBe(false);
  });

  it("writes new content and byte sizes", async () => {
    const { id: ws } = await vfs.createWorkspace({ name: "project" });
    const file = await vfs.createFile({
      workspaceId: ws,
      parentId: null,
      name: "a.txt",
      content: "abc",
    });
    const updated = await vfs.writeFile(file.id, "a".repeat(12));
    expect(updated.size).toBe(12);
    expect(await vfs.readFile(file.id)).toBe("a".repeat(12));
  });

  it("stores and reads binary Blob content", async () => {
    const { id: ws } = await vfs.createWorkspace({ name: "project" });
    const blob = new Blob([new Uint8Array([0x00, 0x01, 0xfe])], {
      type: "application/octet-stream",
    });
    const file = await vfs.createFile({
      workspaceId: ws,
      parentId: null,
      name: "bin.dat",
      content: blob,
    });
    expect(file.size).toBe(3);
    const read = await vfs.readFile(file.id);
    expect(read).toBeInstanceOf(Blob);
    const bytes = new Uint8Array(await (read as Blob).arrayBuffer());
    expect(bytes).toEqual(new Uint8Array([0x00, 0x01, 0xfe]));
  });

  it("lists root children sorted with directories first", async () => {
    const { id: ws } = await vfs.createWorkspace({ name: "project" });
    await vfs.createFile({
      workspaceId: ws,
      parentId: null,
      name: "aa.txt",
      content: "1",
    });
    await vfs.createDirectory({ workspaceId: ws, parentId: null, name: "bb" });
    await vfs.createFile({
      workspaceId: ws,
      parentId: null,
      name: "cc.txt",
      content: "3",
    });
    await vfs.createDirectory({ workspaceId: ws, parentId: null, name: "aa" });
    const names = (await vfs.listChildren(ws, null)).map((node) => node.name);
    expect(names).toEqual(["aa", "bb", "aa.txt", "cc.txt"]);
  });
});

describe("getPath", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("resolves nested virtual paths", async () => {
    const { id: ws } = await vfs.createWorkspace({ name: "project" });
    const src = await vfs.createDirectory({
      workspaceId: ws,
      parentId: null,
      name: "src",
    });
    const lib = await vfs.createDirectory({
      workspaceId: ws,
      parentId: src.id,
      name: "lib",
    });
    const file = await vfs.createFile({
      workspaceId: ws,
      parentId: lib.id,
      name: "cn.ts",
      content: "x",
    });
    expect(await vfs.getPath(src.id)).toBe("/src");
    expect(await vfs.getPath(lib.id)).toBe("/src/lib");
    expect(await vfs.getPath(file.id)).toBe("/src/lib/cn.ts");
  });
});

describe("rename and move", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("renames a node and rejects collisions", async () => {
    const { id: ws } = await vfs.createWorkspace({ name: "project" });
    const a = await vfs.createFile({
      workspaceId: ws,
      parentId: null,
      name: "a.txt",
      content: "x",
    });
    await vfs.createFile({
      workspaceId: ws,
      parentId: null,
      name: "b.txt",
      content: "y",
    });
    const renamed = await vfs.rename(a.id, "c.txt");
    expect(renamed.name).toBe("c.txt");
    await expect(vfs.rename(a.id, "b.txt")).rejects.toMatchObject({ code: "exists" });
  });

  it("moves nodes between directories including back to root", async () => {
    const { id: ws } = await vfs.createWorkspace({ name: "project" });
    const src = await vfs.createDirectory({
      workspaceId: ws,
      parentId: null,
      name: "src",
    });
    const file = await vfs.createFile({
      workspaceId: ws,
      parentId: src.id,
      name: "a.ts",
      content: "x",
    });
    const moved = await vfs.move(file.id, null);
    expect(moved.parentId).toBe("");
    expect(await vfs.getPath(file.id)).toBe("/a.ts");
  });

  it("rejects moving a directory into its own descendant", async () => {
    const { id: ws } = await vfs.createWorkspace({ name: "project" });
    const root = await vfs.createDirectory({
      workspaceId: ws,
      parentId: null,
      name: "root",
    });
    const child = await vfs.createDirectory({
      workspaceId: ws,
      parentId: root.id,
      name: "child",
    });
    const grandchild = await vfs.createDirectory({
      workspaceId: ws,
      parentId: child.id,
      name: "grand",
    });
    await expect(vfs.move(root.id, grandchild.id)).rejects.toMatchObject({
      code: "cycle",
    });
    await expect(vfs.move(root.id, root.id)).rejects.toMatchObject({ code: "cycle" });
  });

  it("rejects moving across workspaces", async () => {
    const { id: wsA } = await vfs.createWorkspace({ name: "a" });
    const { id: wsB } = await vfs.createWorkspace({ name: "b" });
    const foreignDir = await vfs.createDirectory({
      workspaceId: wsB,
      parentId: null,
      name: "foreign",
    });
    const file = await vfs.createFile({
      workspaceId: wsA,
      parentId: null,
      name: "a.txt",
      content: "x",
    });
    await expect(vfs.move(file.id, foreignDir.id)).rejects.toMatchObject({
      code: "invalid",
    });
  });
});

describe("deleteNode", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("removes a file node entirely", async () => {
    const { id: ws } = await vfs.createWorkspace({ name: "project" });
    const file = await vfs.createFile({
      workspaceId: ws,
      parentId: null,
      name: "a.txt",
      content: "x",
    });
    await vfs.deleteNode(file.id);
    expect(await vfs.exists(file.id)).toBe(false);
    await expect(vfs.readFile(file.id)).rejects.toMatchObject({ code: "not-found" });
  });

  it("recursively deletes an entire subtree", async () => {
    const { id: ws } = await vfs.createWorkspace({ name: "project" });
    const src = await vfs.createDirectory({
      workspaceId: ws,
      parentId: null,
      name: "src",
    });
    const lib = await vfs.createDirectory({
      workspaceId: ws,
      parentId: src.id,
      name: "lib",
    });
    const file = await vfs.createFile({
      workspaceId: ws,
      parentId: lib.id,
      name: "cn.ts",
      content: "x",
    });
    const sibling = await vfs.createFile({
      workspaceId: ws,
      parentId: null,
      name: "keep.ts",
      content: "y",
    });
    await vfs.deleteNode(src.id);
    expect(await vfs.exists(src.id)).toBe(false);
    expect(await vfs.exists(lib.id)).toBe(false);
    expect(await vfs.exists(file.id)).toBe(false);
    expect(await vfs.exists(sibling.id)).toBe(true);
  });
});
