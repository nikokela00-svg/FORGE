// Shell layout state: zod-validated persistence, actions the only mutation path
import { z } from "zod";
import { create } from "zustand";
import { persist, type PersistStorage, type StorageValue } from "zustand/middleware";

export const ACTIVE_VIEWS = ["files", "search", "source-control", "extensions"] as const;
export type ActiveView = (typeof ACTIVE_VIEWS)[number];

export const SIDEBAR_MIN = 180;
export const SIDEBAR_MAX = 480;
export const DEFAULT_SIDEBAR_SIZE = 260;
export const PANEL_MIN = 80;
export const PANEL_MAX = 1000;
export const DEFAULT_PANEL_SIZE = 200;

const SHELL_STORAGE_KEY = "forge.shell.v1";
const SHELL_SCHEMA_VERSION = 1;

const shellPersistSchema = z.object({
  activeView: z.enum([...ACTIVE_VIEWS]),
  sidebarOpen: z.boolean(),
  sidebarSize: z.number().min(SIDEBAR_MIN).max(SIDEBAR_MAX),
  panelOpen: z.boolean(),
  panelSize: z.number().min(PANEL_MIN).max(PANEL_MAX),
});

export type ShellPersisted = z.infer<typeof shellPersistSchema>;

const DEFAULT_PERSISTED: ShellPersisted = {
  activeView: "files",
  sidebarOpen: true,
  sidebarSize: DEFAULT_SIDEBAR_SIZE,
  panelOpen: true,
  panelSize: DEFAULT_PANEL_SIZE,
};

export function clampSidebarSize(size: number): number {
  return Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, Math.round(size)));
}

export function clampPanelSize(size: number): number {
  return Math.min(PANEL_MAX, Math.max(PANEL_MIN, Math.round(size)));
}

export interface ShellState extends ShellPersisted {
  shortcutsDialogOpen: boolean;
  setActiveView: (view: ActiveView) => void;
  activateView: (view: ActiveView) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarSize: (pixels: number) => void;
  togglePanel: () => void;
  setPanelOpen: (open: boolean) => void;
  setPanelSize: (pixels: number) => void;
  setShortcutsDialogOpen: (open: boolean) => void;
}

// Storage that can neither throw on a missing API (SSR) nor crash rehydration
function createSafeJSONStorage(
  getStorage: () => Storage | null | undefined,
): PersistStorage<ShellPersisted> {
  return {
    getItem: (name) => {
      try {
        const raw = getStorage()?.getItem(name) ?? null;
        if (raw === null) return null;
        // Arbitrary old JSON is expected; the persist merge revalidates against the schema
        const parsed = JSON.parse(raw) as unknown;
        return parsed as StorageValue<ShellPersisted>;
      } catch {
        return null;
      }
    },
    setItem: (name, value) => {
      try {
        getStorage()?.setItem(name, JSON.stringify(value));
      } catch {
        // Quota or private-mode write failures never crash the shell
      }
    },
    removeItem: (name) => {
      try {
        getStorage()?.removeItem(name);
      } catch {
        // Best-effort removal
      }
    },
  };
}

export function createShellStore(storage?: PersistStorage<ShellPersisted>) {
  return create<ShellState>()(
    persist(
      (set) => ({
        ...DEFAULT_PERSISTED,
        shortcutsDialogOpen: false,
        setActiveView: (activeView) => set({ activeView }),
        activateView: (view) =>
          set((state) =>
            state.activeView === view
              ? { sidebarOpen: !state.sidebarOpen }
              : { activeView: view, sidebarOpen: true },
          ),
        toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
        setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
        setSidebarSize: (pixels) => set({ sidebarSize: clampSidebarSize(pixels) }),
        togglePanel: () => set((state) => ({ panelOpen: !state.panelOpen })),
        setPanelOpen: (panelOpen) => set({ panelOpen }),
        setPanelSize: (pixels) => set({ panelSize: clampPanelSize(pixels) }),
        setShortcutsDialogOpen: (shortcutsDialogOpen) => set({ shortcutsDialogOpen }),
      }),
      {
        name: SHELL_STORAGE_KEY,
        version: SHELL_SCHEMA_VERSION,
        storage:
          storage ??
          createSafeJSONStorage(() => {
            if (typeof localStorage === "undefined") return null;
            return localStorage;
          }),
        partialize: (state): ShellPersisted => ({
          activeView: state.activeView,
          sidebarOpen: state.sidebarOpen,
          sidebarSize: state.sidebarSize,
          panelOpen: state.panelOpen,
          panelSize: state.panelSize,
        }),
        merge: (persisted, current) => {
          const parsed = shellPersistSchema.safeParse(persisted);
          if (!parsed.success) return current;
          return { ...current, ...parsed.data };
        },
      },
    ),
  );
}

export const useShellStore = createShellStore();
