// Pure tree math unit tests — flattening, drop decisions, naming, keyboard nav, type-ahead
import { describe, expect, it } from "vitest";

import {
  type FileNode,
  flattenTree,
  keyNav,
  nextTypeAhead,
  resolveDrop,
  validateName,
} from "@/features/fs";

function node(
  overrides: Partial<FileNode> & Pick<FileNode, "id" | "parentId" | "name" | "type">,
): FileNode {
  return {
    workspaceId: "ws",
    mimeType: null,
    size: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("flattenTree", () => {
  it("sorts root children directories-first then case-insensitively", () => {
    const nodes = [
      node({ id: "c", parentId: "", name: "zeta.txt", type: "file" }),
      node({ id: "a", parentId: "", name: "Alpha", type: "directory" }),
      node({ id: "b", parentId: "", name: "beta.txt", type: "file" }),
    ];
    const rows = flattenTree(nodes, new Set());
    expect(rows.map((row) => (row.kind === "node" ? row.node.id : row.kind))).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("expands directories into their sorted children with depth offsets", () => {
    const nodes = [
      node({ id: "src", parentId: "", name: "src", type: "directory" }),
      node({ id: "readme", parentId: "", name: "readme.md", type: "file" }),
      node({ id: "lib", parentId: "src", name: "lib", type: "directory" }),
      node({ id: "cn", parentId: "lib", name: "cn.ts", type: "file" }),
    ];
    const rows = flattenTree(nodes, new Set(["src", "lib"]));
    expect(
      rows.map((row) =>
        row.kind === "node" ? "  ".repeat(row.depth) + row.node.id : row.kind,
      ),
    ).toEqual(["src", "  lib", "    cn", "readme"]);
  });

  it("keeps collapsed directories as single rows", () => {
    const nodes = [
      node({ id: "src", parentId: "", name: "src", type: "directory" }),
      node({ id: "cn", parentId: "src", name: "cn.ts", type: "file" }),
    ];
    expect(flattenTree(nodes, new Set()).length).toBe(1);
  });

  it("inserts the create row ahead of siblings or at the end", () => {
    const nodes = [
      node({ id: "f1", parentId: "", name: "a.txt", type: "file" }),
      node({ id: "d1", parentId: "", name: "zzz", type: "directory" }),
      node({ id: "f2", parentId: "", name: "c.txt", type: "file" }),
    ];
    const asFiles = flattenTree(nodes, new Set(), { parentId: "", type: "file" });
    expect(
      asFiles.map((row) => (row.kind === "create" ? `#${row.type}` : row.node.id)),
    ).toEqual(["d1", "#file", "f1", "f2"]);
    const asDirectory = flattenTree(nodes, new Set(), {
      parentId: "",
      type: "directory",
    });
    expect(
      asDirectory.map((row) => (row.kind === "create" ? `#${row.type}` : row.node.id)),
    ).toEqual(["#directory", "d1", "f1", "f2"]);
  });

  it("does not insert a create row into an unrelated parent", () => {
    const nodes = [node({ id: "f1", parentId: "", name: "a.txt", type: "file" })];
    const rows = flattenTree(nodes, new Set(), { parentId: "other", type: "file" });
    expect(rows.filter((row) => row.kind === "create")).toHaveLength(0);
  });
});

describe("resolveDrop", () => {
  const nodes = [
    node({ id: "src", parentId: "", name: "src", type: "directory" }),
    node({ id: "inner", parentId: "src", name: "inner", type: "directory" }),
    node({ id: "a", parentId: "", name: "a.txt", type: "file" }),
    node({ id: "b", parentId: "", name: "b.txt", type: "file" }),
  ];

  it("moves a file inside a directory", () => {
    expect(resolveDrop(["a"], "src", "inside", nodes)).toEqual({
      ok: true,
      parentId: "src",
    });
  });

  it("reorders siblings before/after into the target's parent", () => {
    expect(resolveDrop(["b"], "a", "before", nodes)).toEqual({ ok: true, parentId: "" });
    expect(resolveDrop(["a"], "b", "after", nodes)).toEqual({ ok: true, parentId: "" });
  });

  it("rejects dropping a node onto itself", () => {
    expect(resolveDrop(["a"], "a", "after", nodes)).toEqual({
      ok: false,
      reason: "self",
    });
  });

  it("rejects unknown targets and empty drag sets", () => {
    expect(resolveDrop([], "a", "after", nodes)).toEqual({
      ok: false,
      reason: "unknown",
    });
    expect(resolveDrop(["a"], "ghost", "after", nodes)).toEqual({
      ok: false,
      reason: "unknown",
    });
  });

  it("rejects dropping onto a file as an inside parent", () => {
    expect(resolveDrop(["b"], "a", "inside", nodes)).toEqual({
      ok: false,
      reason: "not-a-directory",
    });
  });

  it("rejects moving a directory into its own descendant", () => {
    expect(resolveDrop(["src"], "inner", "inside", nodes)).toEqual({
      ok: false,
      reason: "cycle",
    });
    expect(resolveDrop(["src"], "src", "inside", nodes)).toEqual({
      ok: false,
      reason: "self",
    });
  });

  it("rejects sibling name clashes on move", () => {
    const clash = node({ id: "b2", parentId: "src", name: "b.txt", type: "file" });
    expect(resolveDrop(["b"], "inner", "before", [...nodes, clash])).toEqual({
      ok: false,
      reason: "sibling-name-clash",
    });
  });
});

describe("validateName", () => {
  const siblings = [
    { id: "a", name: "existing.ts" },
    { id: "b", name: "Folder" },
  ];

  it("accepts valid names", () => {
    expect(validateName("new-file.ts", siblings)).toEqual({ ok: true });
  });

  it("rejects empty names", () => {
    expect(validateName("", siblings)).toEqual({ ok: false, reason: "empty" });
  });

  it("rejects illegal characters and dot paths", () => {
    for (const bad of ["a/b.ts", "a\\b.ts", " .x", ".", "..", "x".repeat(256)]) {
      expect(validateName(bad, siblings)).toEqual({ ok: false, reason: "illegal-char" });
    }
  });

  it("rejects duplicate sibling names but ignores the excluded id", () => {
    expect(validateName("existing.ts", siblings)).toEqual({
      ok: false,
      reason: "duplicate-sibling",
    });
    expect(validateName("existing.ts", siblings, "a")).toEqual({ ok: true });
  });
});

describe("keyNav", () => {
  const nodes = [
    node({ id: "src", parentId: "", name: "src", type: "directory" }),
    node({ id: "a", parentId: "src", name: "a.ts", type: "file" }),
    node({ id: "b", parentId: "", name: "b.md", type: "file" }),
  ];
  const expanded = new Set(["src"]);
  const rows = flattenTree(nodes, expanded);

  it("moves up and down the visible list", () => {
    expect(keyNav(rows, "src", "ArrowDown", expanded)).toEqual({
      focusId: "a",
      toggle: null,
    });
    expect(keyNav(rows, "a", "ArrowUp", expanded)).toEqual({
      focusId: "src",
      toggle: null,
    });
    expect(keyNav(rows, "b", "ArrowDown", expanded)).toEqual({
      focusId: "b",
      toggle: null,
    });
  });

  it("collapses expanded folders and jumps to the parent when collapsed", () => {
    expect(keyNav(rows, "src", "ArrowLeft", expanded)).toEqual({
      focusId: "src",
      toggle: "collapse",
    });
    expect(keyNav(rows, "a", "ArrowLeft", new Set())).toEqual({
      focusId: "src",
      toggle: null,
    });
  });

  it("expands folders and descends into the first child", () => {
    expect(keyNav(rows, "src", "ArrowRight", new Set())).toEqual({
      focusId: "src",
      toggle: "expand",
    });
    expect(keyNav(rows, "src", "ArrowRight", expanded)).toEqual({
      focusId: "a",
      toggle: null,
    });
  });

  it("leaves files and roots in place", () => {
    expect(keyNav(rows, "b", "ArrowRight", expanded)).toEqual({
      focusId: "b",
      toggle: null,
    });
    expect(keyNav(rows, "src", "ArrowLeft", new Set())).toEqual({
      focusId: "src",
      toggle: null,
    });
  });

  it("returns null for unknown focus ids (guarding store drift)", () => {
    expect(keyNav(rows, "ghost", "ArrowDown", expanded)).toBeNull();
  });
});

describe("nextTypeAhead", () => {
  const nodes = [
    node({ id: "alpha", parentId: "", name: "alpha.ts", type: "file" }),
    node({ id: "beta", parentId: "", name: "Beta.ts", type: "file" }),
    node({ id: "archive", parentId: "", name: "archive/", type: "directory" }),
  ];
  const rows = flattenTree(nodes, new Set());

  it("finds the first case-insensitive prefix match", () => {
    expect(nextTypeAhead(rows, null, "b")).toBe("beta");
  });

  it("wraps back past the end of the list", () => {
    expect(nextTypeAhead(rows, "archive", "b")).toBe("beta");
    expect(nextTypeAhead(rows, "archive", "a")).toBe("alpha");
  });

  it("ignores whitespace and unmatched input", () => {
    expect(nextTypeAhead(rows, null, " ")).toBeNull();
    expect(nextTypeAhead(rows, null, "z")).toBeNull();
  });
});
