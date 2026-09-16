// Shell store unit tests: defaults, actions, persistence round-trip, corrupt-payload safety
import { describe, expect, it } from "vitest";
import type { PersistStorage } from "zustand/middleware";

import {
  createShellStore,
  PANEL_MAX,
  PANEL_MIN,
  type ShellPersisted,
  SIDEBAR_MAX,
  SIDEBAR_MIN,
} from "@/features/shell";

function memoryStorage(
  seed?: unknown,
): PersistStorage<ShellPersisted> & { raw: () => unknown } {
  let value: unknown = seed ?? undefined;
  return {
    raw: () => value,
    getItem: () => (value === undefined ? null : (value as { state: ShellPersisted })),
    setItem: (_name, next) => {
      value = next;
    },
    removeItem: () => {
      value = undefined;
    },
  };
}

function envelope(state: unknown, version = 1): unknown {
  return { state, version };
}

async function rehydratedStore(storage: ReturnType<typeof memoryStorage>) {
  const store = createShellStore(storage);
  await store.persist.rehydrate();
  return store;
}

describe("shell store", () => {
  it("starts with documented defaults", () => {
    const store = createShellStore(memoryStorage());
    const state = store.getState();
    expect(state.activeView).toBe("files");
    expect(state.sidebarOpen).toBe(true);
    expect(state.sidebarSize).toBe(260);
    expect(state.panelOpen).toBe(true);
    expect(state.panelSize).toBe(200);
    expect(state.shortcutsDialogOpen).toBe(false);
  });

  it("toggles sidebar, panel, and views through actions only", () => {
    const store = createShellStore(memoryStorage());
    store.getState().toggleSidebar();
    expect(store.getState().sidebarOpen).toBe(false);

    store.getState().activateView("search");
    expect(store.getState().activeView).toBe("search");
    expect(store.getState().sidebarOpen).toBe(true);

    store.getState().activateView("search");
    expect(store.getState().sidebarOpen).toBe(false);

    store.getState().togglePanel();
    expect(store.getState().panelOpen).toBe(false);
  });

  it("clamps sizes to the documented bounds", () => {
    const store = createShellStore(memoryStorage());
    store.getState().setSidebarSize(5000);
    expect(store.getState().sidebarSize).toBe(SIDEBAR_MAX);
    store.getState().setSidebarSize(1);
    expect(store.getState().sidebarSize).toBe(SIDEBAR_MIN);
    store.getState().setPanelSize(0);
    expect(store.getState().panelSize).toBe(PANEL_MIN);
    store.getState().setPanelSize(99999);
    expect(store.getState().panelSize).toBe(PANEL_MAX);
  });

  it("round-trips layout through storage", async () => {
    const storage = memoryStorage();
    const first = createShellStore(storage);
    first.getState().activateView("source-control");
    first.getState().setSidebarSize(340);
    first.getState().setPanelSize(260);
    first.getState().toggleSidebar();

    const second = await rehydratedStore(storage);
    expect(second.getState().sidebarOpen).toBe(false);
    expect(second.getState().activeView).toBe("source-control");
    expect(second.getState().sidebarSize).toBe(340);
    expect(second.getState().panelSize).toBe(260);
  });

  it("never persists the shortcuts dialog open flag", async () => {
    const storage = memoryStorage();
    const first = createShellStore(storage);
    first.getState().setSidebarOpen(false);
    first.getState().setShortcutsDialogOpen(true);

    const second = await rehydratedStore(storage);
    expect(second.getState().shortcutsDialogOpen).toBe(false);
    expect(second.getState().sidebarOpen).toBe(false);
  });

  it("falls back to defaults when the payload fails schema validation", async () => {
    const storage = memoryStorage(
      envelope({ activeView: "not-a-view", sidebarSize: -5, sidebarOpen: false }),
    );
    const store = await rehydratedStore(storage);
    expect(store.getState().activeView).toBe("files");
    expect(store.getState().sidebarOpen).toBe(true);
    expect(store.getState().sidebarSize).toBe(260);
  });

  it("falls back to defaults when any single field is out of range", async () => {
    const storage = memoryStorage(envelope({ activeView: "search", sidebarSize: 9999 }));
    const store = await rehydratedStore(storage);
    expect(store.getState().activeView).toBe("files");
    expect(store.getState().sidebarSize).toBe(260);
  });

  it("ignores storage written by an older schema version", async () => {
    const storage = memoryStorage(envelope({ activeView: "extensions" }, 99));
    const store = await rehydratedStore(storage);
    expect(store.getState().activeView).toBe("files");
  });
});
