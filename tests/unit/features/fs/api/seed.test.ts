// Demo workspace seed: stable ids, valid project shape, importable contents
import { beforeEach, describe, expect, it } from "vitest";

import {
  createDemoWorkspace,
  db,
  DEMO_WORKSPACE_ID,
  demoSeedFiles,
  vfs,
} from "@/features/fs";

async function resetDatabase(): Promise<void> {
  await db.delete();
  await db.open();
}

describe("demo workspace seed", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  it("builds a workspace under the stable demo id", async () => {
    const workspace = await createDemoWorkspace();
    expect(workspace.id).toBe(DEMO_WORKSPACE_ID);
    expect(workspace.name).toBe("My Project");
    expect(await vfs.getWorkspace(DEMO_WORKSPACE_ID)).not.toBeNull();
  });

  it("populates the expected virtual tree", async () => {
    await createDemoWorkspace();
    const root = await vfs.listChildren(DEMO_WORKSPACE_ID, null);
    const rootNames = root.map((node) => node.name);
    expect(rootNames).toEqual(["src", "package.json", "README.md"]);

    const src = root.find((node) => node.name === "src");
    expect(src?.type).toBe("directory");
    const srcChildren = await vfs.listChildren(DEMO_WORKSPACE_ID, src?.id ?? null);
    const srcNames = srcChildren.map((node) => node.name);
    expect(srcNames).toContain("index.ts");
    expect(srcNames).toContain("lib");

    const lib = srcChildren.find((node) => node.name === "lib");
    const libChildren = await vfs.listChildren(DEMO_WORKSPACE_ID, lib?.id ?? null);
    expect(libChildren.map((node) => node.name)).toEqual(["cn.ts", "greet.ts"]);
  });

  it("seeds a real, parseable package.json and readable source files", async () => {
    await createDemoWorkspace();
    const root = await vfs.listChildren(DEMO_WORKSPACE_ID, null);
    const pkg = root.find((node) => node.name === "package.json");
    expect(pkg).toBeDefined();
    const raw = await vfs.readFile(pkg?.id ?? "");
    const pkgJson = JSON.parse(typeof raw === "string" ? raw : await raw.text()) as {
      scripts: { dev: string };
    };
    expect(pkgJson.scripts.dev).toContain("node src/index.ts");

    const src = root.find((node) => node.name === "src");
    const srcChildren = await vfs.listChildren(DEMO_WORKSPACE_ID, src?.id ?? null);
    const index = srcChildren.find((node) => node.name === "index.ts");
    expect(await vfs.readFile(index?.id ?? "")).toContain("export function run");
  });

  it("is idempotent — a second call keeps the tree flat", async () => {
    await createDemoWorkspace();
    const firstCount = (await vfs.listChildren(DEMO_WORKSPACE_ID, null)).length;
    const again = await createDemoWorkspace();
    expect(again.id).toBe(DEMO_WORKSPACE_ID);
    expect((await vfs.listChildren(DEMO_WORKSPACE_ID, null)).length).toBe(firstCount);
  });

  it("enumerates seed files with normalized relative paths", () => {
    const paths = demoSeedFiles.map((file) => file.path);
    expect(paths).not.toContain("");
    expect(paths.every((path) => !path.startsWith("/"))).toBe(true);
    expect(demoSeedFiles.every((file) => file.content.length > 0)).toBe(true);
  });
});
