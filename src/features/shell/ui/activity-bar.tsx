// Primary command rail — switch active views and toggle the terminal panel
"use client";

import { PanelBottom } from "lucide-react";

import { TooltipProvider } from "@/shared/ui";

import type { ActiveView } from "../model/shell-store";
import { useShellStore } from "../model/shell-store";
import { ActivityBarItem } from "./activity-bar-item";
import { VIEW_META } from "./views/view-meta";

const VIEW_ORDER: readonly ActiveView[] = [
  "files",
  "search",
  "source-control",
  "extensions",
];

function ActivityBar() {
  const activeView = useShellStore((state) => state.activeView);
  const activateView = useShellStore((state) => state.activateView);
  const panelOpen = useShellStore((state) => state.panelOpen);
  const togglePanel = useShellStore((state) => state.togglePanel);

  return (
    <nav
      aria-label="Primary"
      className="border-border bg-surface-1 flex w-12 shrink-0 flex-col items-center border-r py-1"
    >
      <TooltipProvider>
        {VIEW_ORDER.map((view) => {
          const { icon, label } = VIEW_META[view];
          return (
            <ActivityBarItem
              key={view}
              icon={icon}
              label={label}
              active={activeView === view}
              onClick={() => {
                activateView(view);
              }}
            />
          );
        })}
        <div className="mt-auto flex flex-col items-center gap-1">
          <ActivityBarItem
            icon={PanelBottom}
            label={panelOpen ? "Hide terminal" : "Show terminal"}
            active={panelOpen}
            onClick={togglePanel}
          />
        </div>
      </TooltipProvider>
    </nav>
  );
}

export { ActivityBar };
