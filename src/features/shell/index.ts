// Shell feature public API — layout frame and the model consumers subscribe to
"use client";
export {
  type Binding,
  type BindingDef,
  type BindingId,
  comboParts,
  createKeybindingRegistry,
  detectPlatform,
  type KeybindingRegistry,
  keybindingRegistry,
  matchEvent,
  normalizeCombo,
  parseCombo,
  platformLabel,
  type Scope,
  SHELL_BINDING_DEFS,
  SHELL_RUNNER_BINDINGS,
} from "./model/keybindings";
export {
  ACTIVE_VIEWS,
  type ActiveView,
  createShellStore,
  PANEL_MAX,
  PANEL_MIN,
  type ShellPersisted,
  type ShellState,
  SIDEBAR_MAX,
  SIDEBAR_MIN,
  useShellStore,
} from "./model/shell-store";
export {
  compareStatusItems,
  createStatusRegistry,
  type StatusItem,
  type StatusRegistry,
  statusRegistry,
  useStatusRegistry,
} from "./model/status-registry";
export { ActivityBar } from "./ui/activity-bar";
export { BottomPanel } from "./ui/bottom-panel";
export { EmptyEditor } from "./ui/empty-editor";
export { Shell } from "./ui/shell";
export { ShortcutsDialog } from "./ui/shortcuts-dialog";
export { Sidebar } from "./ui/sidebar";
export { StatusBar } from "./ui/status-bar";
