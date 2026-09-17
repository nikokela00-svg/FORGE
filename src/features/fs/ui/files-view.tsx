// Explorer content — empty state, workspace root listing, delete confirm, import progress
"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { FileText, Folder, FolderOpen, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  IconButton,
  Spinner,
} from "@/shared/ui";
import { toast } from "@/shared/ui";

import { isFileSystemAccessSupported } from "../api/fs-access";
import type { FileNode } from "../api/vfs";
import { vfs } from "../api/vfs";
import { formatBytes } from "../lib/report";
import { useFsStore } from "../model/fs-store";

function useRootChildren(
  workspaceId: string | null,
  listingRevision: number,
): FileNode[] | null | undefined {
  return useLiveQuery(
    () =>
      workspaceId === null
        ? Promise.resolve(null)
        : vfs.listChildren(workspaceId, null).then(sortDirectoriesFirst),
    [workspaceId, listingRevision],
  );
}

function sortDirectoriesFirst(nodes: readonly FileNode[]): FileNode[] {
  return [...nodes].sort((a, b) => {
    if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
    return a.name.localeCompare(b.name, "en", { sensitivity: "base" });
  });
}

function CommitToDelete({
  node,
  open,
  onOpenChange,
  onConfirm,
}: {
  node: FileNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onOpenChange(false);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {node.name}?</DialogTitle>
          <DialogDescription>
            {node.type === "directory"
              ? `This permanently removes ${node.name} and all of its contents from the workspace.`
              : `${node.name} will be permanently removed from the workspace.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary" size="sm">
              Cancel
            </Button>
          </DialogClose>
          <Button variant="danger" size="sm" onClick={onConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NodeRow({
  node,
  onDelete,
}: {
  node: FileNode;
  onDelete: (node: FileNode) => void;
}) {
  const Icon = node.type === "directory" ? Folder : FileText;
  return (
    <li>
      <div className="group hover:bg-surface-2 flex min-w-0 items-center gap-2 rounded-sm px-2 py-1">
        <Icon className="text-fg-muted size-4 shrink-0" aria-hidden="true" />
        <span className="text-fg text-12 min-w-0 flex-1 truncate">{node.name}</span>
        {node.type === "file" && (
          <span className="text-fg-subtle text-11 shrink-0 tabular-nums">
            {formatBytes(node.size)}
          </span>
        )}
        <IconButton
          variant="ghost"
          size="sm"
          aria-label={`Delete ${node.name}`}
          className="opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
          onClick={() => {
            onDelete(node);
          }}
        >
          <Trash2 className="text-fg-muted size-3.5" aria-hidden="true" />
        </IconButton>
      </div>
    </li>
  );
}

function EmptyWorkspace() {
  const openFolderFromDisk = useFsStore((state) => state.openFolderFromDisk);
  const createDemoWorkspace = useFsStore((state) => state.createDemoWorkspace);
  const importState = useFsStore((state) => state.importState);
  const importing = importState.status === "importing";
  const folderSupported = isFileSystemAccessSupported();

  return (
    <div className="flex min-h-full flex-col justify-center gap-3 px-4 py-6">
      <FolderOpen className="text-fg-subtle size-8" aria-hidden="true" />
      <div className="flex flex-col gap-0.5">
        <p className="text-13 text-fg font-medium">No workspace opened yet.</p>
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

function WorkspaceListing({ nodes }: { nodes: FileNode[] }) {
  const openFolderFromDisk = useFsStore((state) => state.openFolderFromDisk);
  const workspaceName = useFsStore((state) => state.currentWorkspaceName);
  const deleteWorkspaceNode = useFsStore((state) => state.deleteWorkspaceNode);
  const [pendingDelete, setPendingDelete] = useState<FileNode | null>(null);

  const confirmDelete = useCallback(() => {
    if (pendingDelete === null) return;
    void deleteWorkspaceNode(pendingDelete.id)
      .then(() => {
        toast(`Deleted ${pendingDelete.name}`);
        setPendingDelete(null);
      })
      .catch((error: unknown) => {
        toast("Delete failed", {
          description: error instanceof Error ? error.message : undefined,
        });
        setPendingDelete(null);
      });
  }, [pendingDelete, deleteWorkspaceNode]);

  return (
    <div className="flex min-h-full flex-col gap-1 px-2 py-3">
      <div className="flex items-center justify-between gap-2 px-2">
        <h3 className="text-11 text-fg-muted min-w-0 flex-1 truncate font-mono tracking-widest uppercase">
          {workspaceName ?? "Workspace"}
        </h3>
        <Button variant="ghost" size="sm" onClick={() => void openFolderFromDisk()}>
          Open Folder…
        </Button>
      </div>
      {nodes.length === 0 ? (
        <p className="text-fg-muted text-12 px-2 py-6">This workspace is empty.</p>
      ) : (
        <ul className="flex flex-col">
          {nodes.map((node) => (
            <NodeRow key={node.id} node={node} onDelete={setPendingDelete} />
          ))}
        </ul>
      )}
      {pendingDelete !== null && (
        <CommitToDelete
          node={pendingDelete}
          open
          onOpenChange={(next) => {
            if (!next) setPendingDelete(null);
          }}
          onConfirm={() => {
            confirmDelete();
          }}
        />
      )}
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
  const nodes = useRootChildren(workspaceId, listingRevision);

  useEffect(() => {
    void reconcileWorkspace();
  }, [reconcileWorkspace]);

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
      <WorkspaceListing nodes={nodes ?? []} />
    </div>
  );
}

export { FilesView };
