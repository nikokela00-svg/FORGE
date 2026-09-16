// Sidebar frame: renders the active view behind a collapse affordance
"use client";

import { ChevronDown } from "lucide-react";

import { IconButton, ScrollArea } from "@/shared/ui";

import type { ActiveView } from "../model/shell-store";
import { useShellStore } from "../model/shell-store";
import { ExtensionsView } from "./views/extensions-view";
import { FilesView } from "./views/files-view";
import { SearchView } from "./views/search-view";
import { SourceControlView } from "./views/source-control-view";
import { VIEW_META } from "./views/view-meta";

const VIEW_COMPONENTS: Record<ActiveView, React.ComponentType> = {
  files: FilesView,
  search: SearchView,
  "source-control": SourceControlView,
  extensions: ExtensionsView,
};

function Sidebar() {
  const activeView = useShellStore((state) => state.activeView);
  const toggleSidebar = useShellStore((state) => state.toggleSidebar);
  const meta = VIEW_META[activeView];
  const ViewComponent = VIEW_COMPONENTS[activeView];

  return (
    <aside
      aria-label={meta.label}
      className="bg-bg text-fg flex h-full min-h-0 w-full flex-col"
    >
      <div className="border-border flex h-8 shrink-0 items-center justify-between border-b px-3">
        <h2 className="text-11 text-fg-muted font-mono tracking-widest uppercase">
          {meta.label}
        </h2>
        <IconButton
          variant="ghost"
          size="sm"
          aria-label="Collapse sidebar"
          onClick={toggleSidebar}
        >
          <ChevronDown className="size-4" />
        </IconButton>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <ViewComponent />
      </ScrollArea>
    </aside>
  );
}

export { Sidebar };
