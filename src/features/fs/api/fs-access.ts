// Import bridge: File System Access handles → VFS workspace, with binary sniff and skip report
import { vfs as defaultVfs, type VfsApi } from "./vfs";

// The File System Access API is not yet part of lib.dom; declare the picker minimally
declare global {
  interface Window {
    showDirectoryPicker?: (options?: { mode?: "read" | "readwrite" }) => Promise<unknown>;
  }
}

export const MAX_IMPORT_BYTES = 2 * 1024 * 1024;
export const BINARY_SNIFF_BYTES = 512;

export interface PortalFileHandle {
  readonly kind: "file";
  readonly name: string;
  getFile(): Promise<File>;
}

export interface PortalDirectoryHandle {
  readonly kind: "directory";
  readonly name: string;
  entries(): AsyncIterable<[string, PortalHandle]>;
}

export type PortalHandle = PortalFileHandle | PortalDirectoryHandle;

export type ImportSkipReason = "too-large" | "read-error";

export interface ImportSkip {
  path: string;
  reason: ImportSkipReason;
}

export interface ImportReport {
  workspaceId: string;
  name: string;
  totalFiles: number;
  importedFiles: number;
  totalBytes: number;
  skipped: ImportSkip[];
}

export interface ImportProgress {
  processed: number;
  total: number;
}

export function isFileSystemAccessSupported(): boolean {
  return (
    typeof window !== "undefined" && typeof window.showDirectoryPicker === "function"
  );
}

export async function requestDirectory(): Promise<PortalDirectoryHandle | null> {
  const picker = typeof window === "undefined" ? undefined : window.showDirectoryPicker;
  if (picker === undefined) return null;
  try {
    const handle = await picker({ mode: "read" });
    return handle as PortalDirectoryHandle;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return null;
    throw error;
  }
}

async function isBinary(file: File): Promise<boolean> {
  const head = await file.slice(0, BINARY_SNIFF_BYTES).arrayBuffer();
  return new Uint8Array(head).some((byte) => byte === 0);
}

async function countFiles(handle: PortalHandle): Promise<number> {
  if (handle.kind === "file") return 1;
  let total = 0;
  for await (const [, entry] of handle.entries()) total += await countFiles(entry);
  return total;
}

async function readPortalFile(
  file: File,
): Promise<{ content: string; size: number } | Blob> {
  if (await isBinary(file)) return file;
  const text = await file.text();
  return { content: text, size: new TextEncoder().encode(text).byteLength };
}

type ReportAccumulator = Pick<ImportReport, "skipped" | "importedFiles" | "totalBytes">;

async function importFileEntry(
  vfsApi: VfsApi,
  workspaceId: string,
  parentId: string | null,
  basePath: string,
  handle: PortalFileHandle,
  progress: ImportProgress,
  report: ReportAccumulator,
): Promise<void> {
  progress.processed += 1;
  try {
    const file = await handle.getFile();
    if (file.size > MAX_IMPORT_BYTES) {
      report.skipped.push({ path: `${basePath}/${handle.name}`, reason: "too-large" });
      return;
    }
    const read = await readPortalFile(file);
    const content = read instanceof Blob ? read : read.content;
    await vfsApi.createFile({
      workspaceId,
      parentId,
      name: handle.name,
      content,
      ...(read instanceof Blob ? { mimeType: file.type || undefined } : {}),
    });
    report.totalBytes += read.size;
    report.importedFiles += 1;
  } catch {
    report.skipped.push({ path: `${basePath}/${handle.name}`, reason: "read-error" });
  }
}

async function importEntries(
  vfsApi: VfsApi,
  workspaceId: string,
  parentId: string | null,
  basePath: string,
  handle: PortalHandle,
  progress: ImportProgress,
  report: ReportAccumulator,
): Promise<void> {
  if (handle.kind === "file") {
    await importFileEntry(
      vfsApi,
      workspaceId,
      parentId,
      basePath,
      handle,
      progress,
      report,
    );
    return;
  }
  const siblingPath = `${basePath}/${handle.name}`;
  try {
    const directory = await vfsApi.createDirectory({
      workspaceId,
      parentId,
      name: handle.name,
    });
    for await (const [, entry] of handle.entries()) {
      await importEntries(
        vfsApi,
        workspaceId,
        directory.id,
        siblingPath,
        entry,
        progress,
        report,
      );
    }
  } catch {
    report.skipped.push({ path: siblingPath, reason: "read-error" });
  }
}

async function runImport(
  vfsApi: VfsApi,
  directory: PortalDirectoryHandle,
  onProgress?: (progress: ImportProgress) => void,
): Promise<ImportReport> {
  const totalFiles = await countFiles(directory);
  const progress: ImportProgress = { processed: 0, total: totalFiles };
  const report: ReportAccumulator = { skipped: [], importedFiles: 0, totalBytes: 0 };
  const workspace = await vfsApi.createWorkspace({ name: directory.name.slice(0, 255) });
  for await (const [, entry] of directory.entries()) {
    await importEntries(vfsApi, workspace.id, null, "", entry, progress, report);
  }
  if (onProgress !== undefined) onProgress(progress);
  return {
    workspaceId: workspace.id,
    name: workspace.name,
    totalFiles: progress.total,
    importedFiles: report.importedFiles,
    totalBytes: report.totalBytes,
    skipped: report.skipped,
  };
}

export async function importWorkspaceFromDirectory(
  directory: PortalDirectoryHandle,
  options: { vfsApi?: VfsApi; onProgress?: (progress: ImportProgress) => void } = {},
): Promise<ImportReport> {
  const vfsApi = options.vfsApi ?? defaultVfs;
  return runImport(vfsApi, directory, options.onProgress);
}
