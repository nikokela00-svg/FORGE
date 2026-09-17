// Exhaustive tests for the virtual path utilities: normalize, join, split, ancestor checks
import { describe, expect, it } from "vitest";

import {
  basename,
  dirname,
  extname,
  fileNameIsValid,
  isAncestorOf,
  isRootPath,
  joinPaths,
  normalizePath,
  pathSegments,
} from "@/features/fs";

describe("normalizePath", () => {
  it("returns root for empty and dot-only input", () => {
    expect(normalizePath("")).toBe("");
    expect(normalizePath(".")).toBe("");
    expect(normalizePath("././.")).toBe("");
  });

  it("collapses leading, trailing, and doubled separators", () => {
    expect(normalizePath("/a/b/")).toBe("a/b");
    expect(normalizePath("a//b")).toBe("a/b");
    expect(normalizePath("///a////b///")).toBe("a/b");
    expect(normalizePath("a")).toBe("a");
  });

  it("resolves dot segments", () => {
    expect(normalizePath("a/./b")).toBe("a/b");
    expect(normalizePath("a/./b/./c")).toBe("a/b/c");
  });

  it("resolves parent segments without escaping above root", () => {
    expect(normalizePath("a/b/..")).toBe("a");
    expect(normalizePath("a/../b")).toBe("b");
    expect(normalizePath("../a")).toBe("a");
    expect(normalizePath("a/b/../../..")).toBe("");
  });

  it("preserves unicode, spaces, and case", () => {
    expect(normalizePath("src/日本語/ファイル.ts")).toBe("src/日本語/ファイル.ts");
    expect(normalizePath("my dir/file name.ts")).toBe("my dir/file name.ts");
    expect(normalizePath("src/App.tsx")).toBe("src/App.tsx");
  });
});

describe("joinPaths", () => {
  it("joins segments with a single separator and normalizes", () => {
    expect(joinPaths("src", "app", "main.ts")).toBe("src/app/main.ts");
    expect(joinPaths("src/", "/app/", "main.ts")).toBe("src/app/main.ts");
    expect(joinPaths("", "b")).toBe("b");
    expect(joinPaths("a", "..", "b")).toBe("b");
    expect(joinPaths()).toBe("");
  });
});

describe("dirname", () => {
  it("returns the parent directory or root", () => {
    expect(dirname("a/b/c.ts")).toBe("a/b");
    expect(dirname("a/b")).toBe("a");
    expect(dirname("a")).toBe("");
    expect(dirname("")).toBe("");
    expect(dirname("/a//b/")).toBe("a");
  });
});

describe("basename", () => {
  it("returns the final segment or root", () => {
    expect(basename("a/b/c.ts")).toBe("c.ts");
    expect(basename("a")).toBe("a");
    expect(basename("a/b/")).toBe("b");
    expect(basename("")).toBe("");
  });
});

describe("extname", () => {
  it("returns the extension with dot, empty for none", () => {
    expect(extname("a/b/c.ts")).toBe(".ts");
    expect(extname("a/b.min.js")).toBe(".js");
    expect(extname("file")).toBe("");
    expect(extname(".dotfile")).toBe("");
    expect(extname("dir/file.")).toBe(".");
  });
});

describe("pathSegments", () => {
  it("splits normalized paths into segments", () => {
    expect(pathSegments("a/b/c")).toEqual(["a", "b", "c"]);
    expect(pathSegments("")).toEqual([]);
    expect(pathSegments("/a//b/")).toEqual(["a", "b"]);
  });
});

describe("isAncestorOf", () => {
  it("treats root as ancestor of everything else", () => {
    expect(isAncestorOf("", "a")).toBe(true);
    expect(isAncestorOf("", "")).toBe(false);
  });

  it("returns true for nested descendants only", () => {
    expect(isAncestorOf("src", "src/app/main.ts")).toBe(true);
    expect(isAncestorOf("a/b", "a/b/c")).toBe(true);
    expect(isAncestorOf("src", "src")).toBe(false);
    expect(isAncestorOf("a/b", "a/bc")).toBe(false);
    expect(isAncestorOf("src", "lib")).toBe(false);
    expect(isAncestorOf("a/b/c", "a")).toBe(false);
  });
});

describe("fileNameIsValid", () => {
  it("rejects separators, dot-paths, and empties", () => {
    expect(fileNameIsValid("")).toBe(false);
    expect(fileNameIsValid(".")).toBe(false);
    expect(fileNameIsValid("..")).toBe(false);
    expect(fileNameIsValid("a/b")).toBe(false);
    expect(fileNameIsValid("a\\b")).toBe(false);
    expect(fileNameIsValid("a\0b")).toBe(false);
  });

  it("accepts normal and unicode names", () => {
    expect(fileNameIsValid("package.json")).toBe(true);
    expect(fileNameIsValid("日本語")).toBe(true);
    expect(fileNameIsValid("a b.ts")).toBe(true);
  });
});

describe("isRootPath", () => {
  it("is true only for the empty virtual root", () => {
    expect(isRootPath("")).toBe(true);
    expect(isRootPath("./.")).toBe(true);
    expect(isRootPath("a")).toBe(false);
    expect(isRootPath("a/b")).toBe(false);
  });
});
