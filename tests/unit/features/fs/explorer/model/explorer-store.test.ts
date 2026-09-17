// Explorer store unit tests — expansion, selection, rename/create/drop intent transitions
import { beforeEach, describe, expect, it } from "vitest";

import { useExplorerStore } from "@/features/fs";

describe("explorer store", () => {
  beforeEach(() => {
    useExplorerStore.getState().resetExplorer();
  });

  it("toggles and expands directories without persisting history", () => {
    const { toggleExpanded, expand } = useExplorerStore.getState();
    toggleExpanded("src");
    expect(useExplorerStore.getState().expandedIds.has("src")).toBe(true);
    toggleExpanded("src");
    expect(useExplorerStore.getState().expandedIds.has("src")).toBe(false);
    expand("src");
    expand("src");
    expect(useExplorerStore.getState().expandedIds.has("src")).toBe(true);
  });

  it("collapseAll empties the expansion set only", () => {
    const { expand, selectOnly, collapseAll } = useExplorerStore.getState();
    expand("src");
    selectOnly("a.ts");
    collapseAll();
    expect(useExplorerStore.getState().expandedIds.size).toBe(0);
    expect(useExplorerStore.getState().selectedIds).toEqual(["a.ts"]);
  });

  it("selectOnly replaces the selection and moves focus", () => {
    const { setSelection, selectOnly } = useExplorerStore.getState();
    setSelection(["a", "b"]);
    selectOnly("c");
    expect(useExplorerStore.getState().selectedIds).toEqual(["c"]);
    expect(useExplorerStore.getState().focusedId).toBe("c");
  });

  it("manages rename and create intents", () => {
    const { startRename, endRename, startCreating, endCreating } =
      useExplorerStore.getState();
    startRename("x");
    expect(useExplorerStore.getState().renamingId).toBe("x");
    endRename();
    expect(useExplorerStore.getState().renamingId).toBeNull();

    startCreating("src", "file");
    expect(useExplorerStore.getState().creating).toEqual({
      parentId: "src",
      type: "file",
    });
    endCreating();
    expect(useExplorerStore.getState().creating).toBeNull();
  });

  it("tracks the active drop target", () => {
    const { setDropTarget } = useExplorerStore.getState();
    setDropTarget({ id: "src", position: "inside" });
    expect(useExplorerStore.getState().dropTarget).toEqual({
      id: "src",
      position: "inside",
    });
    setDropTarget(null);
    expect(useExplorerStore.getState().dropTarget).toBeNull();
  });

  it("resetExplorer restores every field to its initial value", () => {
    const { startCreating, setSelection, expand, setFocused, setDropTarget } =
      useExplorerStore.getState();
    startCreating("", "directory");
    setSelection(["a"]);
    expand("a");
    setFocused("a");
    setDropTarget({ id: "a", position: "after" });
    useExplorerStore.getState().resetExplorer();
    const state = useExplorerStore.getState();
    expect(state.expandedIds.size).toBe(0);
    expect(state.selectedIds).toEqual([]);
    expect(state.focusedId).toBeNull();
    expect(state.renamingId).toBeNull();
    expect(state.creating).toBeNull();
    expect(state.dropTarget).toBeNull();
  });
});
