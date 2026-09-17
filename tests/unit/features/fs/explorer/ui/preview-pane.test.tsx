// Component tests for the read-only preview pane — text, binary, and empty selection fallback
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { db, PreviewPane, useExplorerStore, useFsStore, vfs } from "@/features/fs";
import { siteConfig } from "@/shared/config/site";

async function resetEnvironment(): Promise<void> {
  localStorage.clear();
  await db.delete();
  await db.open();
  useFsStore.setState({
    currentWorkspaceId: null,
    currentWorkspaceName: null,
    listingRevision: 0,
  });
  useExplorerStore.getState().resetExplorer();
}

async function seedFile(content: string | Blob, name = "a.ts") {
  const { id: ws } = await vfs.createWorkspace({ name: "project" });
  const src = await vfs.createDirectory({ workspaceId: ws, parentId: null, name: "src" });
  const file = await vfs.createFile({
    workspaceId: ws,
    parentId: src.id,
    name,
    content,
  });
  useFsStore.setState({
    currentWorkspaceId: ws,
    currentWorkspaceName: "project",
    listingRevision: 1,
  });
  useExplorerStore.getState().selectOnly(file.id);
  return { ws, src, file };
}

describe("PreviewPane", () => {
  beforeEach(async () => {
    await resetEnvironment();
  });

  it("shows the breadcrumb path, line numbers, and text content for a text file", async () => {
    await seedFile("const a = 1;\nconst b = 2;\n");
    render(<PreviewPane />);

    expect(await screen.findByText("/src/a.ts")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("const a = 1;")).toBeInTheDocument();
    });
    expect(screen.getByText("const b = 2;")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("26 B · 3 lines · UTF-8")).toBeInTheDocument();
  });

  it("announces a binary file with a no-preview notice", async () => {
    const blob = new Blob([new Uint8Array([0x00, 0x01, 0xfe, 0xff])], {
      type: "application/octet-stream",
    });
    await seedFile(blob, "bin.dat");
    render(<PreviewPane />);

    expect(await screen.findByText("Binary file — no preview")).toBeInTheDocument();
    expect(screen.getByText("4 B · binary")).toBeInTheDocument();
  });

  it("falls back to the empty editor when nothing or a directory is selected", async () => {
    await seedFile("x");
    useExplorerStore.getState().resetExplorer();
    render(<PreviewPane />);

    expect(await screen.findByText(siteConfig.name)).toBeInTheDocument();
    expect(screen.queryByText("Binary file — no preview")).not.toBeInTheDocument();
  });

  it("switches files cleanly as the selection changes", async () => {
    const { ws } = await seedFile("first\n");
    render(<PreviewPane />);
    expect(await screen.findByText("first")).toBeInTheDocument();

    const second = await vfs.createFile({
      workspaceId: ws,
      parentId: null,
      name: "second.ts",
      content: "second\n",
    });
    useFsStore.setState({ listingRevision: 2 });
    useExplorerStore.getState().selectOnly(second.id);

    expect(await screen.findByText("/second.ts")).toBeInTheDocument();
    expect(await screen.findByText("second")).toBeInTheDocument();
  });
});
