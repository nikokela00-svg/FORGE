# Keybindings — FORGE

Default keyboard shortcuts registered in the shell's keybinding registry
(`src/features/shell/model/keybindings.ts`). The registry is the single
source of truth; this document is enforced by a drift-guard test that reads
both and asserts every registry id appears below.

Platform note: `Mod` maps to `⌘` on macOS and `Ctrl` on all other platforms.

| ID             | Combo   | Scope  | Description             |
| -------------- | ------- | ------ | ----------------------- |
| toggle-sidebar | Mod+B   | global | Toggle sidebar          |
| toggle-panel   | Mod+J   | global | Toggle terminal panel   |
| open-shortcuts | Shift+? | global | Open keyboard shortcuts |
