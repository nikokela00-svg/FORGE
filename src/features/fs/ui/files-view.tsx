// Explorer content — toolbar with create/collapse actions, windowed tree, empty and import states
"use client";

import { FilePlus2, FolderOpen as FolderOpenIcon, ListCollapse } from "lucide-react";
import { useEffect, useState } from "react";

import {
  Button,
  IconButton,
  Spinner,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui";

import { isFileSystemAccessSupported } from "../api/fs-access";
import { useWorkspaceNodes } from "../explorer/lib/use-workspace-nodes";
import { useExplorerStore } from "../explorer/model/explorer-store";
import { FileTree } from "../explorer/ui/file-tree";
import { useFsStore } from "../model/fs-store";

function EmptyWorkspace() {
  const openFolderFromDisk = useFsStore((state) => state.openFolderFromDisk);
  const createDemoWorkspace = useFsStore((state) => state.createDemoWorkspace);
  const importState = useFsStore((state) => state.importState);
  const importing = importState.status === "importing";
  // Resolved after hydration so the server and client render the same safe
  // default; the honest Chromium-only message appears once mounted.
  const [folderSupported, setFolderSupported] = useState(false);

  useEffect(() => {
    // Hydration-safe: initial render must match server (false) so the button
    // is disabled during SSR; the real value is detected client-side.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- justified above
    setFolderSupported(isFileSystemAccessSupported());
  }, []);

  return (
    <div className="flex min-h-full flex-col justify-center gap-3 px-4 py-6">
      <FolderOpenIcon className="text-fg-subtle size-8" aria-hidden="true" />
      <div className="flex flex-col gap-0.5">
        <p className="text-fg text-13 font-medium">No workspace opened yet.</p>
        <p className="text-fg-muted text-12">
          Import a local folder as a workspace, or try the demo project to explore FORGE.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Button
          variant="primary"
          size="sm"
          disabled={importing || !folderSupported}
          title={
            folderSupported
              ? undefined
              : "Folder import requires Chromium — try the demo workspace instead"
          }
          onClick={() => void openFolderFromDisk()}
        >
          {importing ? (
            <>
              <Spinner className="size-3.5" aria-hidden="true" /> Importing…
            </>
          ) : (
            "Open Folder…"
          )}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={importing}
          onClick={() => void createDemoWorkspace()}
        >
          Create Demo Workspace
        </Button>
        {!folderSupported && (
          <p className="text-fg-subtle text-11">
            Folder import requires Chromium — try the demo workspace instead.
          </p>
        )}
      </div>
    </div>
  );
}

function ExplorerToolbar() {
  const workspaceName = useFsStore((state) => state.currentWorkspaceName);
  const openFolderFromDisk = useFsStore((state) => state.openFolderFromDisk);
  const creating = useExplorerStore((state) => state.creating);
  const startCreating = useExplorerStore((state) => state.startCreating);
  const collapseAll = useExplorerStore((state) => state.collapseAll);

  return (
    <div className="border-border flex h-9 shrink-0 items-center justify-between gap-2 border-b px-2">
      <h3 className="text-fg-muted text-11 min-w-0 flex-1 truncate font-mono tracking-widest uppercase">
        {workspaceName ?? "Workspace"}
      </h3>
      <TooltipProvider>
        <div className="flex shrink-0 items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <IconButton
                variant="ghost"
                size="sm"
                aria-label="New File"
                disabled={creating !== null}
                onClick={() => {
                  startCreating("", "file");
                }}
              >
                <FilePlus2 className="size-3.5" aria-hidden="true" />
              </IconButton>
            </TooltipTrigger>
            <TooltipContent>New File</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <IconButton
                variant="ghost"
                size="sm"
                aria-label="New Folder"
                disabled={creating !== null}
                onClick={() => {
                  startCreating("", "directory");
                }}
              >
                <FolderOpenIcon className="size-3.5" aria-hidden="true" />
              </IconButton>
            </TooltipTrigger>
            <TooltipContent>New Folder</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <IconButton
                variant="ghost"
                size="sm"
                aria-label="Collapse All"
                onClick={collapseAll}
              >
                <ListCollapse className="size-3.5" aria-hidden="true" />
              </IconButton>
            </TooltipTrigger>
            <TooltipContent>Collapse All</TooltipContent>
          </Tooltip>
          <Button variant="ghost" size="sm" onClick={() => void openFolderFromDisk()}>
            Open Folder…
          </Button>
        </div>
      </TooltipProvider>
    </div>
  );
}

function ImportProgressLine() {
  const importState = useFsStore((state) => state.importState);
  if (importState.status !== "importing") return null;
  const label =
    importState.total === 0
      ? "Importing…"
      : `Importing… ${importState.processed.toString()}/${importState.total.toString()} files`;
  return (
    <p className="text-fg-muted text-12 flex items-center gap-2 px-2 py-1">
      <Spinner className="size-3.5" aria-hidden="true" />
      <span>{label}</span>
    </p>
  );
}

function FilesView() {
  const workspaceId = useFsStore((state) => state.currentWorkspaceId);
  const listingRevision = useFsStore((state) => state.listingRevision);
  const reconcileWorkspace = useFsStore((state) => state.reconcileWorkspace);
  const resetExplorer = useExplorerStore((state) => state.resetExplorer);
  const nodes = useWorkspaceNodes(workspaceId, listingRevision);

  useEffect(() => {
    void reconcileWorkspace();
  }, [reconcileWorkspace]);

  useEffect(() => {
    resetExplorer();
  }, [workspaceId, resetExplorer]);

  if (workspaceId === null) return <EmptyWorkspace />;
  if (nodes === undefined) {
    return (
      <div className="flex min-h-full items-start gap-2 px-4 py-6">
        <Spinner className="text-fg-muted size-4" aria-hidden="true" />
        <p className="text-fg-muted text-12">Loading workspace&hellip;</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      <ImportProgressLine />
      <ExplorerToolbar />
      <FileTree nodes={nodes} />
    </div>
  );
}

export { FilesView };
