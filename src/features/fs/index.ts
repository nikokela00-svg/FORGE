// File system feature public API — VFS engine, workspace store, and shell contributions
"use client";

import { registerFsContributions } from "./bootstrap";

registerFsContributions();

export { db } from "./api/db";
export {
  BINARY_SNIFF_BYTES,
  type ImportProgress,
  type ImportReport,
  type ImportSkip,
  type ImportSkipReason,
  importWorkspaceFromDirectory,
  isFileSystemAccessSupported,
  MAX_IMPORT_BYTES,
  type PortalDirectoryHandle,
  type PortalFileHandle,
  type PortalHandle,
  requestDirectory,
} from "./api/fs-access";
export { createDemoWorkspace, DEMO_WORKSPACE_ID, demoSeedFiles } from "./api/seed";
export {
  createVfs,
  type FileNode,
  vfs,
  type VfsApi,
  VfsError,
  type VfsErrorCode,
} from "./api/vfs";
export {
  type CreateIntent,
  type CreateRow,
  type DropPosition,
  type DropResolution,
  flattenTree,
  keyNav,
  type KeyNavResult,
  type NameValidation,
  type NavKey,
  nextTypeAhead,
  type NodeRow,
  resolveDrop,
  rowKey,
  validateName,
  type VisibleRow,
} from "./explorer/lib/tree";
export { useWorkspaceNodes } from "./explorer/lib/use-workspace-nodes";
export {
  createExplorerStore,
  type DropTarget,
  EXPLORER_INITIAL_STATE,
  useExplorerStore,
} from "./explorer/model/explorer-store";
export { FileTree } from "./explorer/ui/file-tree";
export { PreviewPane } from "./explorer/ui/preview-pane";
export {
  basename,
  dirname,
  extname,
  fileNameIsValid,
  isAncestorOf,
  isRootPath,
  joinPaths,
  normalizePath,
  pathSegments,
} from "./lib/paths";
export {
  DEFAULT_IMPORT_STATE,
  type FsPersisted,
  type FsState,
  type ImportState,
  type ImportStatus,
  useFsStore,
} from "./model/fs-store";
export { FilesView } from "./ui/files-view";
export { WorkspaceBadge } from "./ui/workspace-badge";
