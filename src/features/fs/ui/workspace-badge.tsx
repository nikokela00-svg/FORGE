// Status bar contribution — current workspace name with a fallback when none is open
"use client";

import { FolderOpen } from "lucide-react";

import { useFsStore } from "../model/fs-store";

function WorkspaceBadge() {
  const workspaceName = useFsStore((state) => state.currentWorkspaceName);
  const label = workspaceName ?? "No workspace";
  return (
    <span
      aria-label={`Workspace: ${label}`}
      title={label}
      className="text-fg-muted text-11 inline-flex h-4.5 max-w-56 min-w-0 items-center gap-1.5 rounded-sm px-1"
    >
      <FolderOpen className="size-3 shrink-0" aria-hidden="true" />
      <span className="max-w-48 min-w-0 truncate">{label}</span>
    </span>
  );
}

export { WorkspaceBadge };
