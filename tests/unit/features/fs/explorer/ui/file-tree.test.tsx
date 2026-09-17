// Component tests for the explorer tree — expand, keyboard, rename, menus, drag-and-drop
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  db,
  FileTree,
  useExplorerStore,
  useFsStore,
  useWorkspaceNodes,
  vfs,
} from "@/features/fs";

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

async function seedTree() {
  const { id: ws } = await vfs.createWorkspace({ name: "project" });
  const src = await vfs.createDirectory({ workspaceId: ws, parentId: null, name: "src" });
  const lib = await vfs.createDirectory({
    workspaceId: ws,
    parentId: src.id,
    name: "lib",
  });
  const a = await vfs.createFile({
    workspaceId: ws,
    parentId: null,
    name: "a.ts",
    content: "export const a = 1;",
  });
  await vfs.createFile({ workspaceId: ws, parentId: src.id, name: "b.ts", content: "" });
  useFsStore.setState({
    currentWorkspaceId: ws,
    currentWorkspaceName: "project",
    listingRevision: 1,
  });
  return { ws, src, lib, a };
}

function TreeHarness() {
  const workspaceId = useFsStore((state) => state.currentWorkspaceId);
  const revision = useFsStore((state) => state.listingRevision);
  const nodes = useWorkspaceNodes(workspaceId, revision);
  if (nodes === undefined) return <div>loading</div>;
  return <FileTree nodes={nodes} />;
}

function dataTransferStub() {
  const stub = {
    effectAllowed: "none",
    dropEffect: "",
    setData: vi.fn(),
    getData: () => "",
    items: [],
    types: [],
  };
  return stub as unknown as DataTransfer;
}

afterEach(() => {
  if (Object.getOwnPropertyDescriptor(window.navigator, "clipboard") !== undefined) {
    Reflect.deleteProperty(window.navigator, "clipboard");
  }
});

describe("FileTree", () => {
  beforeEach(async () => {
    await resetEnvironment();
  });

  it("renders root rows and expands/collapses directories", async () => {
    const user = userEvent.setup();
    await seedTree();
    render(<TreeHarness />);

    expect(await screen.findByRole("treeitem", { name: "src" })).toBeInTheDocument();
    expect(screen.getByRole("treeitem", { name: "a.ts" })).toBeInTheDocument();
    expect(screen.queryByRole("treeitem", { name: "lib" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Expand src" }));
    expect(await screen.findByRole("treeitem", { name: "lib" })).toBeInTheDocument();
    expect(screen.getByRole("treeitem", { name: "b.ts" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Collapse src" }));
    expect(screen.queryByRole("treeitem", { name: "lib" })).not.toBeInTheDocument();
  });

  it("navigates with arrow keys across the visible rows", async () => {
    const user = userEvent.setup();
    const { src, lib } = await seedTree();
    render(<TreeHarness />);

    const tree = await screen.findByRole("tree", { name: "File tree — project" });
    await user.click(screen.getByRole("treeitem", { name: "src" }));

    fireEvent.keyDown(tree, { key: "ArrowRight" });
    expect(screen.getByRole("button", { name: "Collapse src" })).toBeInTheDocument();

    fireEvent.keyDown(tree, { key: "ArrowDown" });
    expect(tree.getAttribute("aria-activedescendant")).toContain(lib.id);

    fireEvent.keyDown(tree, { key: "ArrowLeft" });
    expect(tree.getAttribute("aria-activedescendant")).toContain(src.id);
  });

  it("renames an item inline with F2 and Enter", async () => {
    const user = userEvent.setup();
    const { ws } = await seedTree();
    render(<TreeHarness />);

    const tree = await screen.findByRole("tree", { name: "File tree — project" });
    await user.click(screen.getByRole("treeitem", { name: "src" }));
    fireEvent.keyDown(tree, { key: "F2" });

    const input = screen.getByRole("textbox", { name: "Rename item" });
    fireEvent.change(input, { target: { value: "renamed.ts" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(
      await screen.findByRole("treeitem", { name: "renamed.ts" }),
    ).toBeInTheDocument();
    const nodes = await vfs.listWorkspaceNodes(ws);
    expect(nodes.map((node) => node.name)).toContain("renamed.ts");
  });

  it("moves focus by type-ahead prefix", async () => {
    const user = userEvent.setup();
    const { a } = await seedTree();
    render(<TreeHarness />);

    const tree = await screen.findByRole("tree", { name: "File tree — project" });
    await user.click(screen.getByRole("treeitem", { name: "src" }));
    fireEvent.keyDown(tree, { key: "ArrowRight" });

    await user.type(tree, "a");
    expect(tree.getAttribute("aria-activedescendant")).toContain(a.id);
  });

  it("moves a file into a directory on drop", async () => {
    const user = userEvent.setup();
    const { ws, src, a } = await seedTree();
    render(<TreeHarness />);

    const aRow = await screen.findByRole("treeitem", { name: "a.ts" });
    const srcRow = screen.getByRole("treeitem", { name: "src" });
    srcRow.getBoundingClientRect = () => ({
      top: 0,
      bottom: 22,
      height: 22,
      width: 200,
      left: 0,
      right: 200,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    const transfer = dataTransferStub();
    fireEvent.dragStart(aRow, { dataTransfer: transfer });
    fireEvent.dragOver(srcRow, { clientY: 10, dataTransfer: transfer });
    expect(transfer.dropEffect).toBe("move");
    fireEvent.drop(srcRow, { clientY: 10, dataTransfer: transfer });

    await waitFor(async () => {
      const nodes = await vfs.listWorkspaceNodes(ws);
      expect(nodes.find((node) => node.id === a.id)?.parentId).toBe(src.id);
    });
    await user.click(screen.getByRole("treeitem", { name: "src" }));
  });

  it("rejects dropping a directory onto itself with a none cursor", async () => {
    const user = userEvent.setup();
    const { ws, src } = await seedTree();
    render(<TreeHarness />);

    const srcRow = await screen.findByRole("treeitem", { name: "src" });
    srcRow.getBoundingClientRect = () => ({
      top: 0,
      bottom: 22,
      height: 22,
      width: 200,
      left: 0,
      right: 200,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    const transfer = dataTransferStub();
    fireEvent.dragStart(srcRow, { dataTransfer: transfer });
    fireEvent.dragOver(srcRow, { clientY: 10, dataTransfer: transfer });
    expect(transfer.dropEffect).toBe("none");
    fireEvent.drop(srcRow, { clientY: 10, dataTransfer: transfer });

    await waitFor(async () => {
      const nodes = await vfs.listWorkspaceNodes(ws);
      expect(nodes.find((node) => node.id === src.id)?.parentId).toBe("");
    });
    await user.click(srcRow);
  });

  it("copies the focused item path to the clipboard from the context menu", async () => {
    const user = userEvent.setup();
    await seedTree();
    render(<TreeHarness />);

    const clipboard = { writeText: vi.fn().mockResolvedValue(undefined) };
    Object.defineProperty(window.navigator, "clipboard", {
      configurable: true,
      value: clipboard,
    });

    const srcRow = await screen.findByRole("treeitem", { name: "src" });
    fireEvent.contextMenu(srcRow);
    await user.click(await screen.findByRole("menuitem", { name: "Copy Path" }));

    await waitFor(() => {
      expect(clipboard.writeText).toHaveBeenCalledWith("/src");
    });
  });

  it("converts a context-menu delete into a confirm dialog then removes the node", async () => {
    const user = userEvent.setup();
    const { ws, a } = await seedTree();
    render(<TreeHarness />);

    const aRow = await screen.findByRole("treeitem", { name: "a.ts" });
    fireEvent.contextMenu(aRow);
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));

    const dialog = await screen.findByRole("dialog", { name: "Delete a.ts?" });
    expect(dialog).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(screen.queryByRole("treeitem", { name: "a.ts" })).not.toBeInTheDocument();
    });
    const nodes = await vfs.listWorkspaceNodes(ws);
    expect(nodes.find((node) => node.id === a.id)).toBeUndefined();
  });
});
