// Context menu for tree rows — open, rename, copy path, delete; anchored to the pointer
"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui";

import type { FileNode } from "../../api/vfs";

export interface ContextMenuState {
  x: number;
  y: number;
  node: FileNode;
}

interface TreeContextMenuProps {
  state: ContextMenuState | null;
  multiple: boolean;
  onOpen: () => void;
  onRename: () => void;
  onCopyPath: () => void;
  onDelete: () => void;
  onClose: () => void;
}

function TreeContextMenu({
  state,
  multiple,
  onOpen,
  onRename,
  onCopyPath,
  onDelete,
  onClose,
}: TreeContextMenuProps) {
  return (
    <DropdownMenu
      open={state !== null}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DropdownMenuTrigger asChild>
        <span
          aria-hidden="true"
          className="pointer-events-none fixed z-0 h-px w-px"
          style={state === null ? undefined : { left: state.x, top: state.y }}
        />
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent
          side="bottom"
          sideOffset={2}
          align="start"
          className="w-44"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
          }}
        >
          <DropdownMenuItem onSelect={onOpen}>Open</DropdownMenuItem>
          <DropdownMenuItem onSelect={onRename} disabled={multiple}>
            Rename…
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onCopyPath} disabled={multiple}>
            Copy Path
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={onDelete} className="text-danger">
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
}

export { TreeContextMenu, type TreeContextMenuProps };
