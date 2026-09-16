// Shell — the permanent workspace frame: activity bar, resizable sidebar, editor, bottom panel, status bar
"use client";

import { useEffect, useState } from "react";
import {
  Group,
  type Layout,
  type LayoutChangedMeta,
  Panel,
  Separator,
  usePanelRef,
} from "react-resizable-panels";

import {
  PANEL_MAX,
  PANEL_MIN,
  SIDEBAR_MAX,
  SIDEBAR_MIN,
  useShellStore,
} from "../model/shell-store";
import { ActivityBar } from "./activity-bar";
import { BottomPanel } from "./bottom-panel";
import { EmptyEditor } from "./empty-editor";
import { ShortcutsDialog } from "./shortcuts-dialog";
import { Sidebar } from "./sidebar";
import { StatusBar } from "./status-bar";
import { useShellShortcuts } from "./use-shell-shortcuts";

function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 64rem)");
    const apply = () => {
      setIsDesktop(query.matches);
    };
    apply();
    query.addEventListener("change", apply);
    return () => {
      query.removeEventListener("change", apply);
    };
  }, []);
  return isDesktop;
}

function DesktopSplit() {
  const sidebarRef = usePanelRef();
  const terminalRef = usePanelRef();
  const sidebarOpen = useShellStore((state) => state.sidebarOpen);
  const sidebarSize = useShellStore((state) => state.sidebarSize);
  const setSidebarOpen = useShellStore((state) => state.setSidebarOpen);
  const setSidebarSize = useShellStore((state) => state.setSidebarSize);
  const panelOpen = useShellStore((state) => state.panelOpen);
  const panelSize = useShellStore((state) => state.panelSize);
  const setPanelOpen = useShellStore((state) => state.setPanelOpen);
  const setPanelSize = useShellStore((state) => state.setPanelSize);

  useEffect(() => {
    if (sidebarOpen) sidebarRef.current?.resize(sidebarSize);
    else sidebarRef.current?.collapse();
  }, [sidebarOpen, sidebarSize, sidebarRef]);

  useEffect(() => {
    if (panelOpen) terminalRef.current?.resize(panelSize);
    else terminalRef.current?.collapse();
  }, [panelOpen, panelSize, terminalRef]);

  function handleSplitLayout(layout: Layout, meta: LayoutChangedMeta): void {
    if (!meta.isUserInteraction) return;
    const sidebarPixels = layout.sidebar ?? 0;
    if (sidebarPixels <= 0) setSidebarOpen(false);
    else {
      setSidebarSize(sidebarPixels);
      setSidebarOpen(true);
    }
  }

  function handlePanelLayout(layout: Layout, meta: LayoutChangedMeta): void {
    if (!meta.isUserInteraction) return;
    const terminalPixels = layout.terminal ?? 0;
    if (terminalPixels <= 0) setPanelOpen(false);
    else {
      setPanelSize(terminalPixels);
      setPanelOpen(true);
    }
  }

  return (
    <Group
      orientation="horizontal"
      className="flex min-h-0 min-w-0 flex-1"
      onLayoutChanged={handleSplitLayout}
    >
      <Panel
        id="sidebar"
        className="min-h-0 min-w-0"
        collapsible
        collapsedSize={0}
        defaultSize={sidebarOpen ? sidebarSize : 0}
        minSize={SIDEBAR_MIN}
        maxSize={SIDEBAR_MAX}
        panelRef={sidebarRef}
      >
        <Sidebar />
      </Panel>
      <Separator />
      <Panel id="main" className="flex min-h-0 min-w-0 flex-col">
        <Group
          orientation="vertical"
          className="flex min-h-0 min-w-0 flex-1"
          onLayoutChanged={handlePanelLayout}
        >
          <Panel id="editor" className="min-h-0 min-w-0">
            <EmptyEditor />
          </Panel>
          <Separator />
          <Panel
            id="terminal"
            className="min-h-0 min-w-0"
            collapsible
            collapsedSize={0}
            defaultSize={panelOpen ? panelSize : 0}
            minSize={PANEL_MIN}
            maxSize={PANEL_MAX}
            panelRef={terminalRef}
          >
            <BottomPanel />
          </Panel>
        </Group>
      </Panel>
    </Group>
  );
}

function MobileMain() {
  const sidebarOpen = useShellStore((state) => state.sidebarOpen);
  const setSidebarOpen = useShellStore((state) => state.setSidebarOpen);
  const panelOpen = useShellStore((state) => state.panelOpen);

  useEffect(() => {
    if (!sidebarOpen) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => {
      window.removeEventListener("keydown", close);
    };
  }, [sidebarOpen, setSidebarOpen]);

  if (sidebarOpen) {
    return (
      <>
        <div
          aria-hidden="true"
          onClick={() => {
            setSidebarOpen(false);
          }}
          className="bg-overlay z-overlay animate-in fade-in-0 absolute inset-0"
        />
        <div
          role="complementary"
          aria-label="Sidebar"
          tabIndex={-1}
          className="z-modal border-border bg-bg shadow-e2 absolute inset-y-0 left-12 w-72 border-r focus:outline-none"
        >
          <Sidebar />
        </div>
      </>
    );
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="min-h-0 flex-1">
        <EmptyEditor />
      </div>
      {panelOpen && (
        <div className="border-border h-48 shrink-0 border-t">
          <BottomPanel />
        </div>
      )}
    </div>
  );
}

function Shell() {
  const isDesktop = useIsDesktop();
  useShellShortcuts();

  return (
    <div className="bg-bg text-fg flex h-dvh flex-col overflow-hidden">
      <div className="relative flex min-h-0 flex-1">
        <ActivityBar />
        {isDesktop ? <DesktopSplit /> : <MobileMain />}
      </div>
      <StatusBar />
      <ShortcutsDialog />
    </div>
  );
}

export { Shell };
