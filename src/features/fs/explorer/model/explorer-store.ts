// Explorer UI state — expansion, selection, focus, rename/create/drop intent; session-only
import { create } from "zustand";

import type { NodeType } from "../../api/db";
import type { CreateIntent, DropPosition } from "../lib/tree";

export interface DropTarget {
  id: string;
  position: DropPosition;
}

interface ExplorerState {
  expandedIds: ReadonlySet<string>;
  selectedIds: readonly string[];
  focusedId: string | null;
  renamingId: string | null;
  creating: CreateIntent | null;
  dropTarget: DropTarget | null;
  toggleExpanded: (id: string) => void;
  expand: (id: string) => void;
  collapseAll: () => void;
  selectOnly: (id: string) => void;
  setSelection: (ids: readonly string[]) => void;
  setFocused: (id: string | null) => void;
  startRename: (id: string) => void;
  endRename: () => void;
  startCreating: (parentId: string, type: NodeType) => void;
  endCreating: () => void;
  setDropTarget: (target: DropTarget | null) => void;
  resetExplorer: () => void;
}

export const EXPLORER_INITIAL_STATE = {
  expandedIds: new Set<string>(),
  selectedIds: [] as readonly string[],
  focusedId: null as string | null,
  renamingId: null as string | null,
  creating: null as CreateIntent | null,
  dropTarget: null as DropTarget | null,
};

export function createExplorerStore() {
  return create<ExplorerState>()((set) => ({
    ...EXPLORER_INITIAL_STATE,
    toggleExpanded: (id) => {
      set((state) => {
        const next = new Set(state.expandedIds);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return { expandedIds: next };
      });
    },
    expand: (id) => {
      set((state) => {
        if (state.expandedIds.has(id)) return state;
        const next = new Set(state.expandedIds);
        next.add(id);
        return { expandedIds: next };
      });
    },
    collapseAll: () => {
      set({ expandedIds: new Set<string>() });
    },
    selectOnly: (id) => {
      set({ selectedIds: [id], focusedId: id });
    },
    setSelection: (ids) => {
      set({ selectedIds: ids });
    },
    setFocused: (id) => {
      set({ focusedId: id });
    },
    startRename: (id) => {
      set({ renamingId: id });
    },
    endRename: () => {
      set({ renamingId: null });
    },
    startCreating: (parentId, type) => {
      set({ creating: { parentId, type } });
    },
    endCreating: () => {
      set({ creating: null });
    },
    setDropTarget: (target) => {
      set({ dropTarget: target });
    },
    resetExplorer: () => {
      set(EXPLORER_INITIAL_STATE);
    },
  }));
}

export const useExplorerStore = createExplorerStore();
