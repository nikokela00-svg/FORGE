// Import bridge tests with mocked directory/file handles against a real VFS
import { beforeEach, describe, expect, it } from "vitest";

import {
  db,
  importWorkspaceFromDirectory,
  MAX_IMPORT_BYTES,
  type PortalDirectoryHandle,
  type PortalHandle,
  requestDirectory,
  vfs,
} from "@/features/fs";

function fileHandle(name: string, content: BlobPart, type = ""): PortalHandle {
  return {
    kind: "file",
    name,
    getFile: () =>
      Promise.resolve(new File([content], name, type === "" ? {} : { type })),
  };
}

function directoryHandle(
  name: string,
  entries: Array<[string, PortalHandle]>,
): PortalDirectoryHandle {
  return {
    kind: "directory",
    name,
    entries: async function* () {
      await Promise.resolve();
      for (const entry of entries) yield entry;
    },
  };
}

async function resetDatabase(): Promise<void> {
  await db.delete();
  await db.open();
}

describe("importWorkspaceFromDirectory", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("imports a nested tree with an accurate report", async () => {
    const root = directoryHandle("myproj", [
      ["README.md", fileHandle("README.md", "# myproj")],
      [
        "src",
        directoryHandle("src", [
          ["main.ts", fileHandle("main.ts", "export const x = 1;")],
          ["index.css", fileHandle("index.css", "body { margin: 0 }")],
        ]),
      ],
    ]);

    const report = await importWorkspaceFromDirectory(root);

    expect(report.name).toBe("myproj");
    expect(report.totalFiles).toBe(3);
    expect(report.importedFiles).toBe(3);
    expect(report.skipped).toEqual([]);
    expect(report.totalBytes).toBeGreaterThan(0);

    const rootNodes = await vfs.listChildren(report.workspaceId, null);
    expect(rootNodes.map((node) => node.name)).toEqual(["src", "README.md"]);
    const src = rootNodes.find((node) => node.name === "src");
    const srcNodes = await vfs.listChildren(report.workspaceId, src?.id ?? null);
    expect(srcNodes.map((node) => node.name)).toEqual(["index.css", "main.ts"]);
    expect(srcNodes[1]?.type).toBe("file");
  });

  it("sniffs binary files and stores them as Blobs", async () => {
    const bytes = new Uint8Array([0x00, 0x01, 0xfe, 0xff]);
    const root = directoryHandle("media", [
      ["logo.bin", fileHandle("logo.bin", bytes, "application/octet-stream")],
      ["notes.md", fileHandle("notes.md", "plain text")],
    ]);

    const report = await importWorkspaceFromDirectory(root);

    expect(report.importedFiles).toBe(2);

    const nodes = await vfs.listChildren(report.workspaceId, null);
    const logo = nodes.find((node) => node.name === "logo.bin");
    expect(logo?.mimeType).toBe("application/octet-stream");
    const content = await vfs.readFile(logo?.id ?? "");
    expect(content).toBeInstanceOf(Blob);

    const notes = nodes.find((node) => node.name === "notes.md");
    expect(await vfs.readFile(notes?.id ?? "")).toBe("plain text");
  });

  it("reports files larger than the import limit instead of importing them", async () => {
    const oversized = fileHandle("huge.bin", new Uint8Array(MAX_IMPORT_BYTES + 1));
    const root = directoryHandle("big", [["huge.bin", oversized]]);

    const report = await importWorkspaceFromDirectory(root);

    expect(report.importedFiles).toBe(0);
    expect(report.skipped).toHaveLength(1);
    expect(report.skipped[0]).toMatchObject({ path: "/huge.bin", reason: "too-large" });
    expect(await vfs.listChildren(report.workspaceId, null)).toHaveLength(0);
  });

  it("invokes the progress callback as files are processed", async () => {
    const root = directoryHandle("p", [
      ["a.ts", fileHandle("a.ts", "a")],
      ["b.ts", fileHandle("b.ts", "b")],
      ["c.ts", fileHandle("c.ts", "c")],
    ]);
    const ticks: number[] = [];
    await importWorkspaceFromDirectory(root, {
      onProgress: (progress) => ticks.push(progress.processed),
    });
    expect(ticks[ticks.length - 1]).toBe(3);
  });
});

describe("requestDirectory", () => {
  beforeEach(() => {
    delete (window as { showDirectoryPicker?: unknown }).showDirectoryPicker;
  });

  it("returns null silently when the picker API is unsupported", async () => {
    expect(await requestDirectory()).toBeNull();
  });

  it("returns null silently when the user aborts the picker", async () => {
    (window as { showDirectoryPicker?: unknown }).showDirectoryPicker = () =>
      Promise.reject(new DOMException("aborted", "AbortError"));
    expect(await requestDirectory()).toBeNull();
  });

  it("returns the selected directory handle", async () => {
    const handle = directoryHandle("picked", [["a.txt", fileHandle("a.txt", "x")]]);
    (window as { showDirectoryPicker?: unknown }).showDirectoryPicker = () =>
      Promise.resolve(handle);
    const result = await requestDirectory();
    expect(result?.name).toBe("picked");
  });
});
