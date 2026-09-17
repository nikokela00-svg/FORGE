// Register the file system feature's shell contributions (status item, ⌘O) once, at import
import { createElement } from "react";

import { keybindingRegistry, statusRegistry, useShellStore } from "@/features/shell";

import { useFsStore } from "./model/fs-store";
import { WorkspaceBadge } from "./ui/workspace-badge";

let registered = false;

export function registerFsContributions(): void {
  if (registered) return;
  registered = true;
  statusRegistry.register({
    id: "fs.workspace",
    node: createElement(WorkspaceBadge),
    order: 10,
    priority: "normal",
  });
  keybindingRegistry.register({
    id: "open-workspace",
    combo: "Mod+O",
    scope: "global",
    description: "Open folder as workspace",
    run: () => {
      useShellStore.getState().setActiveView("files");
      void useFsStore.getState().openFolderFromDisk();
    },
  });
}
