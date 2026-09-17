// Windowed file tree — store-driven expansion, selection, keyboard, type-ahead, native drag-and-drop
"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { ChevronRight, Folder, FolderOpen } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/shared/lib/utils";
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  toast,
} from "@/shared/ui";

import type { FileNode } from "../../api/vfs";
import { vfs } from "../../api/vfs";
import { useFsStore } from "../../model/fs-store";
import { fileGlyph } from "../lib/icons";
import {
  type DropPosition,
  flattenTree,
  keyNav,
  nextTypeAhead,
  resolveDrop,
  rowKey,
  type VisibleRow,
} from "../lib/tree";
import { useExplorerStore } from "../model/explorer-store";
import { InlineInput } from "./inline-input";
import { type ContextMenuState, TreeContextMenu } from "./tree-context-menu";

const ROW_HEIGHT = 22;
const TREE_ITEM_PREFIX = "forge-tree-item-";

function itemDomId(id: string): string {
  return `${TREE_ITEM_PREFIX}${id}`;
}

function createRowDomId(parentId: string, type: string): string {
  return `${TREE_ITEM_PREFIX}create-${parentId}-${type}`;
}

// ClientY relative to the row decides before/inside/after against the 22px row.
function pointerPosition(
  clientY: number,
  element: HTMLElement,
  isDirectory: boolean,
): DropPosition {
  const rect = element.getBoundingClientRect();
  const offset = clientY - rect.top;
  if (offset <= 7) return "before";
  if (offset >= 15) return "after";
  if (!isDirectory) return "after";
  return "inside";
}

function copyTextToClipboard(text: string): Promise<void> {
  if (typeof navigator !== "undefined") {
    return navigator.clipboard.writeText(text);
  }
  return Promise.reject(new Error("Clipboard unavailable"));
}

// Row glyph: directories switch between closed/open, files use the extension map.
function NodeGlyph({
  type,
  name,
  expanded,
  className,
}: {
  type: "file" | "directory";
  name: string;
  expanded: boolean;
  className: string;
}) {
  if (type === "directory") {
    return expanded ? (
      <FolderOpen className={className} aria-hidden="true" />
    ) : (
      <Folder className={className} aria-hidden="true" />
    );
  }
  return fileGlyph(name, className);
}

function RowIndent({ depth }: { depth: number }) {
  if (depth === 0) return null;
  return (
    <div aria-hidden="true" className="flex h-full shrink-0 items-stretch">
      {Array.from({ length: depth }, (_, index) => (
        <span key={index} className="border-border-muted w-3.5 self-stretch border-l" />
      ))}
    </div>
  );
}

function DropMarker({
  position,
  isDirectory,
}: {
  position: DropPosition;
  isDirectory: boolean;
}) {
  if (position === "before") {
    return (
      <span className="bg-accent absolute inset-x-1 top-0 h-px" aria-hidden="true" />
    );
  }
  if (position === "after") {
    return (
      <span className="bg-accent absolute inset-x-1 bottom-0 h-px" aria-hidden="true" />
    );
  }
  if (isDirectory) {
    return (
      <span
        className="ring-accent absolute inset-x-1 inset-y-1 rounded-sm ring-1"
        aria-hidden="true"
      />
    );
  }
  return null;
}

interface RegionSelectHandler {
  shift: boolean;
  ctrl: boolean;
}

interface TreeNodeRowProps {
  node: FileNode;
  depth: number;
  position: number;
  total: number;
  selected: boolean;
  expanded: boolean;
  editing: boolean;
  drop: DropPosition | null;
  siblings: readonly { id: string; name: string }[];
  onSelect: (node: FileNode, modifiers: RegionSelectHandler) => void;
  onToggleExpand: (node: FileNode) => void;
  onContextMenu: (node: FileNode, x: number, y: number) => void;
  onFocusTree: () => void;
  onRenameCommit: (id: string, name: string) => void;
  onRenameCancel: () => void;
  onDragStart: (node: FileNode) => void;
  onDragOver: (
    node: FileNode,
    clientY: number,
    target: HTMLElement,
    dataTransfer: DataTransfer,
  ) => void;
  onDrop: (node: FileNode, clientY: number, target: HTMLElement) => void;
  onDragEnd: () => void;
}

function TreeNodeRow({
  node,
  depth,
  position,
  total,
  selected,
  expanded,
  editing,
  drop,
  siblings,
  onSelect,
  onToggleExpand,
  onContextMenu,
  onFocusTree,
  onRenameCommit,
  onRenameCancel,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: TreeNodeRowProps) {
  const isDirectory = node.type === "directory";

  return (
    <div
      id={itemDomId(node.id)}
      role="treeitem"
      aria-level={depth + 1}
      aria-posinset={position}
      aria-setsize={total}
      aria-selected={selected}
      aria-expanded={isDirectory ? expanded : undefined}
      draggable={!editing}
      onPointerDown={onFocusTree}
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", node.id);
        onDragStart(node);
      }}
      onDragOver={(event) => {
        onDragOver(node, event.clientY, event.currentTarget, event.dataTransfer);
      }}
      onDrop={(event) => {
        onDrop(node, event.clientY, event.currentTarget);
      }}
      onDragEnd={onDragEnd}
      onClick={(event) => {
        onSelect(node, { shift: event.shiftKey, ctrl: event.ctrlKey || event.metaKey });
      }}
      onDoubleClick={() => {
        if (isDirectory) onToggleExpand(node);
      }}
      onContextMenu={(event) => {
        event.preventDefault();
        onContextMenu(node, event.clientX, event.clientY);
      }}
      className={cn(
        "group text-12 relative flex h-full w-full min-w-0 cursor-default items-center gap-0.5 pr-1.5",
        selected
          ? "bg-accent-muted text-fg"
          : "text-fg-muted hover:bg-surface-2 hover:text-fg",
      )}
    >
      <RowIndent depth={depth} />
      {isDirectory && (
        <button
          type="button"
          aria-label={`${expanded ? "Collapse" : "Expand"} ${node.name}`}
          className="text-fg-muted hover:text-fg focus-visible:ring-focus-ring flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-xs outline-none focus-visible:ring-2"
          onClick={(event) => {
            event.stopPropagation();
            onToggleExpand(node);
          }}
        >
          <ChevronRight
            className={cn("size-3 transition-transform", expanded && "rotate-90")}
            aria-hidden="true"
          />
        </button>
      )}
      {!isDirectory && <span className="w-4 shrink-0" aria-hidden="true" />}
      <NodeGlyph
        type={node.type}
        name={node.name}
        expanded={expanded}
        className={cn("size-3.5 shrink-0", isDirectory ? "text-accent" : "text-fg-muted")}
      />
      {editing ? (
        <InlineInput
          initialValue={node.name}
          siblings={siblings}
          excludeId={node.id}
          selectBasenameOnly={!isDirectory}
          onCommit={(name) => {
            onRenameCommit(node.id, name);
          }}
          onCancel={onRenameCancel}
        />
      ) : (
        <span className="min-w-0 flex-1 truncate">{node.name}</span>
      )}
      {drop !== null && <DropMarker position={drop} isDirectory={isDirectory} />}
    </div>
  );
}

interface CreateRowViewProps {
  parentId: string;
  type: "file" | "directory";
  depth: number;
  position: number;
  total: number;
  siblings: readonly { id: string; name: string }[];
  placeholder: string;
  onCommit: (name: string) => void;
  onCancel: () => void;
}

function CreateRowView({
  parentId,
  type,
  depth,
  position,
  total,
  siblings,
  placeholder,
  onCommit,
  onCancel,
}: CreateRowViewProps) {
  return (
    <div
      id={createRowDomId(parentId, type)}
      role="treeitem"
      aria-level={depth + 1}
      aria-posinset={position}
      aria-setsize={total}
      aria-selected="false"
      className="text-fg-muted text-12 flex h-full items-center gap-0.5 pr-1.5"
    >
      <RowIndent depth={depth} />
      <span className="w-4 shrink-0" aria-hidden="true" />
      {type === "directory" ? (
        <Folder className="text-fg-muted size-3.5 shrink-0" aria-hidden="true" />
      ) : (
        <>{fileGlyph(".ts", "size-3.5 shrink-0 text-fg-muted")}</>
      )}
      <InlineInput
        initialValue=""
        siblings={siblings}
        placeholder={placeholder}
        label={type === "directory" ? "New folder name" : "New file name"}
        onCommit={onCommit}
        onCancel={onCancel}
      />
    </div>
  );
}

interface DeleteIntent {
  nodes: FileNode[];
}

function ConfirmDeleteDialog({
  intent,
  onOpenChange,
  onConfirm,
}: {
  intent: DeleteIntent | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  if (intent === null) return null;
  const single =
    intent.nodes.length === 1 && intent.nodes[0] !== undefined ? intent.nodes[0] : null;
  const title =
    single !== null
      ? `Delete ${single.name}?`
      : `Delete ${intent.nodes.length.toString()} items?`;
  const description =
    single !== null
      ? single.type === "directory"
        ? `This permanently removes ${single.name} and all of its contents from the workspace.`
        : `${single.name} will be permanently removed from the workspace.`
      : "These items and their contents will be permanently removed from the workspace.";
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
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

function FileTree({ nodes }: { nodes: readonly FileNode[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragIdsRef = useRef<ReadonlyArray<string>>([]);
  const typeaheadRef = useRef({ text: "", timer: 0 });

  const expandedIds = useExplorerStore((state) => state.expandedIds);
  const selectedIds = useExplorerStore((state) => state.selectedIds);
  const focusedId = useExplorerStore((state) => state.focusedId);
  const renamingId = useExplorerStore((state) => state.renamingId);
  const creating = useExplorerStore((state) => state.creating);
  const dropTarget = useExplorerStore((state) => state.dropTarget);
  const toggleExpanded = useExplorerStore((state) => state.toggleExpanded);
  const expand = useExplorerStore((state) => state.expand);
  const selectOnly = useExplorerStore((state) => state.selectOnly);
  const setSelection = useExplorerStore((state) => state.setSelection);
  const setFocused = useExplorerStore((state) => state.setFocused);
  const startRename = useExplorerStore((state) => state.startRename);
  const endRename = useExplorerStore((state) => state.endRename);
  const endCreating = useExplorerStore((state) => state.endCreating);
  const setDropTarget = useExplorerStore((state) => state.setDropTarget);

  const moveWorkspaceNodes = useFsStore((state) => state.moveWorkspaceNodes);
  const deleteWorkspaceNode = useFsStore((state) => state.deleteWorkspaceNode);
  const createWorkspaceNode = useFsStore((state) => state.createWorkspaceNode);
  const renameWorkspaceNode = useFsStore((state) => state.renameWorkspaceNode);
  const workspaceName = useFsStore((state) => state.currentWorkspaceName);

  const rows: VisibleRow[] = useMemo(
    () => flattenTree(nodes, expandedIds, creating),
    [nodes, expandedIds, creating],
  );
  const rowIndexById = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((row, index) => {
      if (row.kind === "node") map.set(row.node.id, index);
    });
    return map;
  }, [rows]);
  const byId = useMemo(
    () => new Map(nodes.map((node) => [node.id, node] as const)),
    [nodes],
  );
  const siblingsByParent = useMemo(() => {
    const map = new Map<string, { id: string; name: string }[]>();
    for (const node of nodes) {
      const list = map.get(node.parentId);
      if (list === undefined) {
        map.set(node.parentId, [{ id: node.id, name: node.name }]);
      } else {
        list.push({ id: node.id, name: node.name });
      }
    }
    return map;
  }, [nodes]);

  // TanStack Virtual's useVirtualizer returns non-memoizable helpers by design —
  // the tree is the only consumer and rows are cheap, so compiler memoization is unnecessary.
  // eslint-disable-next-line react-hooks/incompatible-library -- see rationale above
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
    getItemKey: (index) => {
      const row = rows[index];
      return row === undefined ? `row-${index.toString()}` : rowKey(row);
    },
  });

  const [menu, setMenu] = useState<ContextMenuState | null>(null);
  const [deleteIntent, setDeleteIntent] = useState<DeleteIntent | null>(null);

  const focusTree = useCallback(() => {
    scrollRef.current?.focus();
  }, []);

  const scrollToRow = useCallback(
    (id: string) => {
      const index = rowIndexById.get(id);
      if (index === undefined) return;
      virtualizer.scrollToIndex(index, { align: "auto" });
    },
    [rowIndexById, virtualizer],
  );

  useEffect(() => {
    if (focusedId !== null) scrollToRow(focusedId);
  }, [focusedId, scrollToRow]);

  const selectRangeTo = useCallback(
    (targetId: string) => {
      const state = useExplorerStore.getState();
      const anchor = state.focusedId ?? state.selectedIds[0] ?? null;
      const targetIndex = rowIndexById.get(targetId);
      if (targetIndex === undefined) return;
      const anchorIndex = anchor === null ? undefined : rowIndexById.get(anchor);
      const start = Math.min(anchorIndex ?? targetIndex, targetIndex);
      const end = Math.max(anchorIndex ?? targetIndex, targetIndex);
      const ids = rows
        .slice(start, end + 1)
        .flatMap((row) => (row.kind === "node" ? [row.node.id] : []));
      setSelection(ids);
      setFocused(targetId);
    },
    [rows, rowIndexById, setSelection, setFocused],
  );

  const handleRowSelect = useCallback(
    (node: FileNode, modifiers: RegionSelectHandler) => {
      focusTree();
      if (modifiers.shift) {
        selectRangeTo(node.id);
        return;
      }
      if (modifiers.ctrl) {
        const { selectedIds: current } = useExplorerStore.getState();
        const next = current.includes(node.id)
          ? current.filter((id) => id !== node.id)
          : [...current, node.id];
        setSelection(next);
        setFocused(node.id);
        return;
      }
      selectOnly(node.id);
    },
    [focusTree, selectRangeTo, setSelection, setFocused, selectOnly],
  );

  const handleRenameCommit = useCallback(
    (id: string, name: string) => {
      renameWorkspaceNode(id, name)
        .then(() => {
          endRename();
        })
        .catch((error: unknown) => {
          endRename();
          toast("Rename failed", {
            description: error instanceof Error ? error.message : undefined,
          });
        });
    },
    [renameWorkspaceNode, endRename],
  );

  const handleCreateCommit = useCallback(
    (parentId: string, type: "file" | "directory", name: string) => {
      createWorkspaceNode({ parentId, name, type })
        .then(() => {
          endCreating();
        })
        .catch((error: unknown) => {
          endCreating();
          toast("Create failed", {
            description: error instanceof Error ? error.message : undefined,
          });
        });
    },
    [createWorkspaceNode, endCreating],
  );

  const openFile = useCallback(
    (node: FileNode) => {
      if (node.type === "directory") {
        toggleExpanded(node.id);
      } else {
        selectOnly(node.id);
      }
    },
    [toggleExpanded, selectOnly],
  );

  const copyPath = useCallback((id: string) => {
    void vfs
      .getPath(id)
      .then(async (path: string) => {
        await copyTextToClipboard(path);
        return path;
      })
      .then((path: string) => {
        toast(`Copied ${path}`);
      })
      .catch((error: unknown) => {
        toast("Copy failed", {
          description: error instanceof Error ? error.message : undefined,
        });
      });
  }, []);

  const targetsFromIds = useCallback(
    (ids: readonly string[]): FileNode[] => {
      return ids
        .map((id) => byId.get(id))
        .filter((node): node is FileNode => node !== undefined);
    },
    [byId],
  );

  const requestDelete = useCallback(
    (anchor: FileNode) => {
      const { selectedIds: current } = useExplorerStore.getState();
      const ids = current.includes(anchor.id) ? current : [anchor.id];
      setDeleteIntent({ nodes: targetsFromIds(ids) });
    },
    [targetsFromIds],
  );

  const pruneRemoved = useCallback((removed: ReadonlySet<string>) => {
    const state = useExplorerStore.getState();
    const selected = state.selectedIds.filter((id) => !removed.has(id));
    const focused =
      state.focusedId !== null && removed.has(state.focusedId) ? null : state.focusedId;
    const renaming =
      state.renamingId !== null && removed.has(state.renamingId)
        ? null
        : state.renamingId;
    useExplorerStore.setState({
      selectedIds: selected,
      focusedId: focused,
      renamingId: renaming,
    });
  }, []);

  const confirmDelete = useCallback(() => {
    if (deleteIntent === null) return;
    const removed = new Set(deleteIntent.nodes.map((node) => node.id));
    const summary =
      deleteIntent.nodes.length === 1
        ? (deleteIntent.nodes[0]?.name ?? "item")
        : `${deleteIntent.nodes.length.toString()} items`;
    Promise.all(deleteIntent.nodes.map((node) => deleteWorkspaceNode(node.id)))
      .then(() => {
        toast(`Deleted ${summary}`);
        setDeleteIntent(null);
        pruneRemoved(removed);
      })
      .catch((error: unknown) => {
        toast("Delete failed", {
          description: error instanceof Error ? error.message : undefined,
        });
        setDeleteIntent(null);
      });
  }, [deleteIntent, deleteWorkspaceNode, pruneRemoved]);

  const openMenuAt = useCallback(
    (node: FileNode, x: number, y: number) => {
      focusTree();
      const { selectedIds: current } = useExplorerStore.getState();
      if (!current.includes(node.id)) selectOnly(node.id);
      setMenu({ x, y, node });
    },
    [focusTree, selectOnly],
  );

  const openMenuForFocused = useCallback(() => {
    if (focusedId === null) return;
    const node = byId.get(focusedId);
    if (node === undefined) return;
    const element = document.getElementById(itemDomId(focusedId));
    const rect = element?.getBoundingClientRect();
    openMenuAt(node, rect?.left ?? 0, rect?.bottom ?? 0);
  }, [focusedId, byId, openMenuAt]);

  const handleDragStart = useCallback((node: FileNode) => {
    const { selectedIds: current } = useExplorerStore.getState();
    dragIdsRef.current = current.includes(node.id) ? current : [node.id];
  }, []);

  const handleDragOver = useCallback(
    (
      node: FileNode,
      clientY: number,
      target: HTMLElement,
      dataTransfer: DataTransfer,
    ) => {
      const dragIds = dragIdsRef.current;
      if (dragIds.length === 0) return;
      const position = pointerPosition(clientY, target, node.type === "directory");
      const resolution = resolveDrop(dragIds, node.id, position, nodes);
      if (resolution.ok) {
        dataTransfer.dropEffect = "move";
        setDropTarget({ id: node.id, position });
      } else {
        dataTransfer.dropEffect = "none";
        setDropTarget(null);
      }
    },
    [nodes, setDropTarget],
  );

  const handleDrop = useCallback(
    (node: FileNode, clientY: number, target: HTMLElement) => {
      const dragIds = dragIdsRef.current;
      dragIdsRef.current = [];
      setDropTarget(null);
      if (dragIds.length === 0) return;
      const position = pointerPosition(clientY, target, node.type === "directory");
      const resolution = resolveDrop(dragIds, node.id, position, nodes);
      if (!resolution.ok) return;
      moveWorkspaceNodes([...dragIds], resolution.parentId).catch((error: unknown) => {
        toast("Move failed", {
          description: error instanceof Error ? error.message : undefined,
        });
      });
    },
    [nodes, setDropTarget, moveWorkspaceNodes],
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.target instanceof HTMLInputElement) return;
      const id = focusedId;
      const key = event.key;

      if (
        key === "ArrowUp" ||
        key === "ArrowDown" ||
        key === "ArrowLeft" ||
        key === "ArrowRight"
      ) {
        if (id === null) return;
        event.preventDefault();
        const result = keyNav(rows, id, key, expandedIds);
        if (result === null) return;
        if (result.toggle === "expand") expand(result.focusId);
        if (result.toggle === "collapse") toggleExpanded(result.focusId);
        setFocused(result.focusId);
        if (result.toggle === null) scrollToRow(result.focusId);
        return;
      }
      if (key === "Enter") {
        if (id === null) return;
        event.preventDefault();
        const focusedRow = rows[rowIndexById.get(id) ?? -1];
        if (focusedRow?.kind === "node") openFile(focusedRow.node);
        return;
      }
      if (key === "F2") {
        if (id === null) return;
        event.preventDefault();
        startRename(id);
        return;
      }
      if (key === "Delete" || key === "Backspace") {
        if (id === null) return;
        event.preventDefault();
        const { selectedIds: current } = useExplorerStore.getState();
        const ids = current.includes(id) ? current : [id];
        setDeleteIntent({ nodes: targetsFromIds(ids) });
        return;
      }
      if (key === "ContextMenu" || key === "Menu" || (key === "F10" && event.shiftKey)) {
        event.preventDefault();
        openMenuForFocused();
        return;
      }
      if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        const buffer = (typeaheadRef.current.text + key).slice(-16);
        typeaheadRef.current.text = buffer;
        window.clearTimeout(typeaheadRef.current.timer);
        typeaheadRef.current.timer = window.setTimeout(() => {
          typeaheadRef.current.text = "";
        }, 900);
        const next = nextTypeAhead(rows, id, buffer);
        if (next !== null) {
          setFocused(next);
          scrollToRow(next);
        }
      }
    },
    [
      rows,
      rowIndexById,
      focusedId,
      expandedIds,
      expand,
      toggleExpanded,
      setFocused,
      scrollToRow,
      openFile,
      startRename,
      targetsFromIds,
      openMenuForFocused,
    ],
  );

  const workspaceLabel = workspaceName ?? "workspace";
  const menuMultiple = selectedIds.length > 1;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {rows.length === 0 ? (
        <p className="text-fg-muted text-12 px-3 py-6">This workspace is empty.</p>
      ) : (
        <div
          ref={scrollRef}
          role="tree"
          aria-label={`File tree — ${workspaceLabel}`}
          aria-multiselectable="true"
          aria-activedescendant={focusedId === null ? undefined : itemDomId(focusedId)}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onDragOver={(event) => {
            event.preventDefault();
          }}
          onDrop={(event) => {
            event.preventDefault();
          }}
          onDragLeave={() => {
            setDropTarget(null);
          }}
          className="min-h-0 flex-1 overflow-auto pr-1 outline-none"
        >
          <div
            className="relative"
            style={{ height: `${virtualizer.getTotalSize().toString()}px` }}
          >
            {virtualizer.getVirtualItems().map((item) => {
              const row = rows[item.index];
              if (row === undefined) return null;
              const key = rowKey(row);
              if (row.kind === "create") {
                return (
                  <div
                    key={key}
                    data-index={item.index}
                    ref={virtualizer.measureElement}
                    style={virtualItemStyle(item.start, item.size)}
                    className="absolute top-0 left-0 w-full"
                  >
                    <CreateRowView
                      parentId={row.parentId}
                      type={row.type}
                      depth={row.depth}
                      position={item.index + 1}
                      total={rows.length}
                      siblings={siblingsByParent.get(row.parentId) ?? []}
                      placeholder={
                        row.type === "directory" ? "New folder name" : "New file name"
                      }
                      onCommit={(name) => {
                        handleCreateCommit(row.parentId, row.type, name);
                      }}
                      onCancel={endCreating}
                    />
                  </div>
                );
              }
              const { node } = row;
              const editing = renamingId === node.id;
              const drop =
                dropTarget !== null && dropTarget.id === node.id
                  ? dropTarget.position
                  : null;
              return (
                <div
                  key={key}
                  data-index={item.index}
                  ref={virtualizer.measureElement}
                  style={virtualItemStyle(item.start, item.size)}
                  className="absolute top-0 left-0 w-full"
                >
                  <TreeNodeRow
                    node={node}
                    depth={row.depth}
                    position={item.index + 1}
                    total={rows.length}
                    selected={selectedIds.includes(node.id)}
                    expanded={expandedIds.has(node.id)}
                    editing={editing}
                    drop={drop}
                    siblings={siblingsByParent.get(node.parentId) ?? []}
                    onSelect={handleRowSelect}
                    onToggleExpand={(target) => {
                      toggleExpanded(target.id);
                    }}
                    onContextMenu={(target, x, y) => {
                      openMenuAt(target, x, y);
                    }}
                    onFocusTree={focusTree}
                    onRenameCommit={handleRenameCommit}
                    onRenameCancel={endRename}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onDragEnd={() => {
                      dragIdsRef.current = [];
                      setDropTarget(null);
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
      <TreeContextMenu
        state={menu}
        multiple={menuMultiple}
        onOpen={() => {
          if (menu !== null) openFile(menu.node);
        }}
        onRename={() => {
          if (menu !== null) startRename(menu.node.id);
        }}
        onCopyPath={() => {
          if (menu !== null) copyPath(menu.node.id);
        }}
        onDelete={() => {
          if (menu !== null) requestDelete(menu.node);
        }}
        onClose={() => {
          setMenu(null);
        }}
      />
      <ConfirmDeleteDialog
        intent={deleteIntent}
        onOpenChange={(next) => {
          if (!next) setDeleteIntent(null);
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function virtualItemStyle(start: number, size: number): React.CSSProperties {
  return {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: size,
    transform: `translateY(${start.toString()}px)`,
  };
}

export { FileTree };
