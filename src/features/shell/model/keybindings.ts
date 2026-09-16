// Typed shortcut registry — single source of truth for combos, scope, descriptions
import { useShellStore } from "./shell-store";

export type Scope = "global" | "view";
export type Platform = "mac" | "other";

export function detectPlatform(platform?: string): Platform {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  return /Mac/i.test(platform ?? ua) ? "mac" : "other";
}

export function normalizeCombo(combo: string, platform: Platform): string {
  return combo
    .split("+")
    .map((token) => (token === "Mod" ? (platform === "mac" ? "Meta" : "Ctrl") : token))
    .join("+");
}

export interface ParsedCombo {
  key: string;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  meta: boolean;
}

export function parseCombo(combo: string): ParsedCombo {
  let key = "";
  const mods = { ctrl: false, alt: false, shift: false, meta: false };
  for (const token of combo.split("+")) {
    const upper = token.toUpperCase();
    switch (upper) {
      case "CTRL":
        mods.ctrl = true;
        break;
      case "ALT":
      case "OPTION":
        mods.alt = true;
        break;
      case "SHIFT":
        mods.shift = true;
        break;
      case "META":
      case "CMD":
      case "⌘":
        mods.meta = true;
        break;
      default:
        if (key !== "")
          throw new Error(`Invalid combo "${combo}": multiple keys detected`);
        key = token;
    }
  }
  if (key === "") throw new Error(`Invalid combo "${combo}": no key found`);
  return { key, ...mods };
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") return true;
  if (target.isContentEditable) return true;
  return false;
}

export function matchEvent(
  event: KeyboardEvent,
  combo: string,
  options: { allowInInput?: boolean; platform?: Platform } = {},
): boolean {
  const platform = options.platform ?? detectPlatform();
  if (!options.allowInInput && isEditableTarget(event.target)) return false;
  const { key, ctrl, alt, shift, meta } = parseCombo(normalizeCombo(combo, platform));
  if (event.key.toLowerCase() !== key.toLowerCase()) return false;
  if (event.ctrlKey !== ctrl) return false;
  if (event.altKey !== alt) return false;
  if (event.shiftKey !== shift) return false;
  if (event.metaKey !== meta) return false;
  return true;
}

export function comboParts(combo: string, platform: Platform): string[] {
  return normalizeCombo(combo, platform)
    .split("+")
    .map((token) => {
      if (platform === "mac") {
        switch (token) {
          case "Ctrl":
            return "^";
          case "Alt":
            return "⌥";
          case "Shift":
            return "⇧";
          case "Meta":
            return "⌘";
          default:
            return token;
        }
      }
      return token;
    });
}

export function platformLabel(combo: string, platform?: Platform): string {
  const resolved = platform ?? detectPlatform();
  return comboParts(normalizeCombo(combo, resolved), resolved).join(
    resolved === "mac" ? "" : "+",
  );
}

export type ShellAction = "toggle-sidebar" | "toggle-panel" | "open-shortcuts";
export type BindingId = ShellAction | (string & {});

export interface BindingDef {
  id: BindingId;
  combo: string;
  scope: Scope;
  description: string;
  allowInInput?: boolean;
}

export interface ShellBindingDef extends BindingDef {
  id: ShellAction;
}

export interface BindingInput extends BindingDef {
  run: () => void;
}

export interface Binding extends BindingDef {
  run: () => void;
  parsed: ParsedCombo;
  normalizedCombo: string;
}

export const SHELL_BINDING_DEFS: readonly ShellBindingDef[] = [
  {
    id: "toggle-sidebar",
    combo: "Mod+B",
    scope: "global",
    description: "Toggle sidebar",
  },
  {
    id: "toggle-panel",
    combo: "Mod+J",
    scope: "global",
    description: "Toggle terminal panel",
  },
  {
    id: "open-shortcuts",
    combo: "Shift+?",
    scope: "global",
    description: "Open keyboard shortcuts",
  },
];

export function createKeybindingRegistry(bindings: readonly BindingInput[] = []) {
  const platform = detectPlatform();
  const byId = new Map<string, Binding>();
  const list: Binding[] = [];

  function register(def: BindingInput): void {
    if (byId.has(def.id)) throw new Error(`Duplicate binding id "${def.id}"`);
    const normalizedCombo = normalizeCombo(def.combo, platform);
    const parsed = parseCombo(normalizedCombo);
    const conflict = list.find(
      (existing) =>
        existing.scope === def.scope &&
        existing.normalizedCombo.toUpperCase() === normalizedCombo.toUpperCase(),
    );
    if (conflict) {
      throw new Error(
        `Binding "${def.id}" conflicts with "${conflict.id}" — same combo "${conflict.combo}" in scope "${def.scope}"`,
      );
    }
    const binding: Binding = { ...def, normalizedCombo, parsed };
    byId.set(def.id, binding);
    list.push(binding);
  }

  function unregister(id: string): void {
    if (byId.delete(id)) {
      const idx = list.findIndex((binding) => binding.id === id);
      if (idx !== -1) list.splice(idx, 1);
    }
  }

  function getById(id: string): Binding | null {
    return byId.get(id) ?? null;
  }

  function getBindings(): readonly Binding[] {
    return list;
  }

  function registerMany(inputs: readonly BindingInput[]): void {
    for (const input of inputs) register(input);
  }

  for (const input of bindings) register(input);

  return { register, unregister, getById, list: getBindings, registerMany } as const;
}

export type KeybindingRegistry = ReturnType<typeof createKeybindingRegistry>;

const SHELL_RUNNERS: Record<ShellAction, () => void> = {
  "toggle-sidebar": () => {
    useShellStore.getState().toggleSidebar();
  },
  "toggle-panel": () => {
    useShellStore.getState().togglePanel();
  },
  "open-shortcuts": () => {
    useShellStore.getState().setShortcutsDialogOpen(true);
  },
};

export const SHELL_RUNNER_BINDINGS: readonly BindingInput[] = SHELL_BINDING_DEFS.map(
  (def) => ({ ...def, run: SHELL_RUNNERS[def.id] }),
);

export const keybindingRegistry = createKeybindingRegistry(SHELL_RUNNER_BINDINGS);
