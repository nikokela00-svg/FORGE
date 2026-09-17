// Current workspace + import orchestration: persisted selection, toast-driven summaries
import { z } from "zod";
import { create } from "zustand";
import { type PersistStorage } from "zustand/middleware";
import { persist } from "zustand/middleware";

import { createSafeJSONStorage } from "@/shared/lib/storage";
import { toast } from "@/shared/ui";

import {
  type ImportProgress,
  importWorkspaceFromDirectory,
  requestDirectory,
} from "../api/fs-access";
import { createDemoWorkspace as seedDemoWorkspace } from "../api/seed";
import { vfs, type VfsApi, type WorkspaceMeta } from "../api/vfs";
import { describeReport } from "../lib/report";

const FS_STORAGE_KEY = "forge.fs.v1";
const FS_SCHEMA_VERSION = 1;

const persistSchema = z.object({
  currentWorkspaceId: z.string().nullable(),
  currentWorkspaceName: z.string().nullable(),
});

export type FsPersisted = z.infer<typeof persistSchema>;

export type ImportStatus = "idle" | "importing" | "error";

export interface ImportState {
  status: ImportStatus;
  message: string | null;
  processed: number;
  total: number;
}

export const DEFAULT_IMPORT_STATE: ImportState = {
  status: "idle",
  message: null,
  processed: 0,
  total: 0,
};

export interface FsState extends FsPersisted {
  importState: ImportState;
  listingRevision: number;
  openWorkspace: (workspaceId: string | null, workspaceName: string | null) => void;
  openFolderFromDisk: (vfsApi?: VfsApi) => Promise<void>;
  createDemoWorkspace: (vfsApi?: VfsApi) => Promise<WorkspaceMeta>;
  reconcileWorkspace: (vfsApi?: VfsApi) => Promise<void>;
  deleteWorkspaceNode: (id: string) => Promise<void>;
  clearImportState: () => void;
}

function applyProgress(processed: number, total: number): ImportState {
  return { status: "importing", message: null, processed, total };
}

export function createFsStore(storage?: PersistStorage<FsPersisted>) {
  return create<FsState>()(
    persist(
      (set, get) => ({
        currentWorkspaceId: null,
        currentWorkspaceName: null,
        importState: DEFAULT_IMPORT_STATE,
        listingRevision: 0,
        openWorkspace: (currentWorkspaceId, currentWorkspaceName) =>
          set({ currentWorkspaceId, currentWorkspaceName }),
        openFolderFromDisk: async (vfsApi) => {
          const handle = await requestDirectory();
          if (handle === null) return;
          set({ importState: applyProgress(0, 0) });
          try {
            const report = await importWorkspaceFromDirectory(handle, {
              ...(vfsApi !== undefined ? { vfsApi } : {}),
              onProgress: (progress: ImportProgress) =>
                set({ importState: applyProgress(progress.processed, progress.total) }),
            });
            set({
              currentWorkspaceId: report.workspaceId,
              currentWorkspaceName: report.name,
              importState: DEFAULT_IMPORT_STATE,
            });
            toast(
              report.importedFiles === 0
                ? "Nothing imported"
                : `Imported ${report.importedFiles.toString()} file${report.importedFiles === 1 ? "" : "s"}`,
              { description: describeReport(report) },
            );
          } catch (error) {
            const message = error instanceof Error ? error.message : "Import failed";
            set({ importState: { status: "error", message, processed: 0, total: 0 } });
            toast("Import failed", { description: message });
          }
        },
        createDemoWorkspace: async (vfsApi) => {
          const resolved = vfsApi ?? vfs;
          const workspace = await seedDemoWorkspace(resolved);
          get().openWorkspace(workspace.id, workspace.name);
          return workspace;
        },
        reconcileWorkspace: async (vfsApi) => {
          const currentId = get().currentWorkspaceId;
          if (currentId === null) return;
          const existing = await (vfsApi ?? vfs).getWorkspace(currentId);
          if (existing !== null) return;
          get().openWorkspace(null, null);
        },
        clearImportState: () => set({ importState: DEFAULT_IMPORT_STATE }),
        deleteWorkspaceNode: async (id) => {
          await vfs.deleteNode(id);
          set((state) => ({ listingRevision: state.listingRevision + 1 }));
        },
      }),
      {
        name: FS_STORAGE_KEY,
        version: FS_SCHEMA_VERSION,
        storage:
          storage ??
          createSafeJSONStorage<FsPersisted>(() => {
            if (typeof localStorage === "undefined") return null;
            return localStorage;
          }),
        partialize: (state): FsPersisted => ({
          currentWorkspaceId: state.currentWorkspaceId,
          currentWorkspaceName: state.currentWorkspaceName,
        }),
        merge: (persisted, current) => {
          const parsed = persistSchema.safeParse(persisted);
          if (!parsed.success) return current;
          return { ...current, ...parsed.data };
        },
      },
    ),
  );
}

export const useFsStore = createFsStore();
