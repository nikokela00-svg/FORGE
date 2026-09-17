// Demo workspace — a stable, idempotent starter tree for first-run exploration
import { basename, dirname } from "../lib/paths";
import { vfs, type VfsApi, type WorkspaceMeta } from "./vfs";

export const DEMO_WORKSPACE_ID = "demo-project";

const PACKAGE_JSON = JSON.stringify(
  {
    name: "forge-demo",
    version: "0.1.0",
    private: true,
    description: "A starter workspace exploring FORGE's virtual file system",
    scripts: { dev: "node src/index.ts", typecheck: "tsc --noEmit" },
    devDependencies: { typescript: "^5.0.0" },
  },
  null,
  2,
);

const README_MD = `# FORGE Demo Workspace

This workspace lives entirely inside FORGE's IndexedDB-backed virtual file
system. Nothing here touches your real disk.

Try the keyboard shortcut \`Mod+O\` to import a local folder as a new
workspace, or delete this one from the Explorer.

- \`src/index.ts\` — an entry module to open in the editor (later phase)
- \`src/lib/cn.ts\` — the classname combiner used across FORGE
`;

const INDEX_TS = `// Demo entry — swap this out for your own project
import { greet } from "./lib/greet";

export function run(): void {
  const message = greet("FORGE");
  console.log(message);
}
`;

const CN_TS = `// Merge conditional class names into a single Tailwind-safe string
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
`;

const GREET_TS = `// Tiny demo helper
export function greet(name: string): string {
  return \`Hello from \${name}\`;
}
`;

export const demoSeedFiles: readonly { path: string; content: string }[] = [
  { path: "package.json", content: `${PACKAGE_JSON}\n` },
  { path: "README.md", content: README_MD },
  { path: "src/index.ts", content: INDEX_TS },
  { path: "src/lib/greet.ts", content: GREET_TS },
  { path: "src/lib/cn.ts", content: CN_TS },
];

async function ensureDirectories(
  vfsApi: VfsApi,
  workspaceId: string,
  parentPath: string,
  dirIds: Map<string, string | null>,
): Promise<string | null> {
  const segments = parentPath === "" ? [] : parentPath.split("/");
  let current = "";
  let currentId: string | null = null;
  for (const segment of segments) {
    current = current === "" ? segment : `${current}/${segment}`;
    const existing = dirIds.get(current);
    if (existing !== undefined) {
      currentId = existing;
      continue;
    }
    const created = await vfsApi.createDirectory({
      workspaceId,
      parentId: currentId,
      name: segment,
    });
    dirIds.set(current, created.id);
    currentId = created.id;
  }
  return currentId;
}

export async function createDemoWorkspace(vfsApi: VfsApi = vfs): Promise<WorkspaceMeta> {
  const existing = await vfsApi.getWorkspace(DEMO_WORKSPACE_ID);
  if (existing !== null) return existing;
  const workspace = await vfsApi.createWorkspace({
    id: DEMO_WORKSPACE_ID,
    name: "My Project",
  });
  const dirIds = new Map<string, string | null>([["", null]]);
  for (const file of demoSeedFiles) {
    const parentPath = dirname(file.path);
    const parentId = await ensureDirectories(vfsApi, workspace.id, parentPath, dirIds);
    await vfsApi.createFile({
      workspaceId: workspace.id,
      parentId,
      name: basename(file.path),
      content: file.content,
    });
  }
  return workspace;
}
