// Component tests for the workspace files view: both states, demo populate, reactive delete
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { db, DEFAULT_IMPORT_STATE, FilesView, useFsStore, vfs } from "@/features/fs";

async function resetEnvironment(): Promise<void> {
  localStorage.clear();
  await db.delete();
  await db.open();
  useFsStore.setState({
    currentWorkspaceId: null,
    currentWorkspaceName: null,
    importState: DEFAULT_IMPORT_STATE,
  });
}

describe("FilesView", () => {
  beforeEach(async () => {
    await resetEnvironment();
  });

  it("renders the empty state with demo and folder actions when no workspace is open", () => {
    render(<FilesView />);
    expect(screen.getByText("No workspace opened yet.")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Create Demo Workspace" })).toHaveLength(
      1,
    );
  });

  it("degrades the folder import button honestly on unsupported browsers", () => {
    render(<FilesView />);
    const openFolder = screen.getByRole("button", { name: "Open Folder…" });
    expect(openFolder).toBeDisabled();
    expect(
      screen.getByText(
        "Folder import requires Chromium — try the demo workspace instead.",
      ),
    ).toBeInTheDocument();
  });

  it("populates the listing when the demo workspace is created", async () => {
    const user = userEvent.setup();
    render(<FilesView />);

    await user.click(screen.getByRole("button", { name: "Create Demo Workspace" }));

    expect(await screen.findByText("package.json")).toBeInTheDocument();
    expect(screen.getByText("README.md")).toBeInTheDocument();
    expect(screen.getByText("src")).toBeInTheDocument();
  });

  it("shows an honest empty state for a workspace with no files", async () => {
    render(<FilesView />);

    useFsStore.setState({
      currentWorkspaceId: (await vfs.createWorkspace({ name: "Empty" })).id,
      currentWorkspaceName: "Empty",
    });
    expect(await screen.findByText("This workspace is empty.")).toBeInTheDocument();
  });

  it("removes a node through the context menu and updates the list reactively", async () => {
    const user = userEvent.setup();
    render(<FilesView />);

    await user.click(screen.getByRole("button", { name: "Create Demo Workspace" }));
    expect(await screen.findByText("package.json")).toBeInTheDocument();

    fireEvent.contextMenu(screen.getByRole("treeitem", { name: "package.json" }));
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));
    const dialog = await screen.findByRole("dialog", {
      name: "Delete package.json?",
    });
    expect(dialog).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => {
      expect(screen.queryByText("package.json")).not.toBeInTheDocument();
    });
    expect(screen.getByText("README.md")).toBeInTheDocument();
  });
});
