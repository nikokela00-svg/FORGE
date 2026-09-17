// Reactive workspace listing — one workspace-wide liveQuery, keyed by listing revision
import { useLiveQuery } from "dexie-react-hooks";

import { type FileNode, vfs } from "../../api/vfs";

export function useWorkspaceNodes(
  workspaceId: string | null,
  listingRevision: number,
): FileNode[] | undefined {
  return useLiveQuery(
    () =>
      workspaceId === null
        ? Promise.resolve<FileNode[]>([])
        : vfs.listWorkspaceNodes(workspaceId),
    [workspaceId, listingRevision],
  );
}
