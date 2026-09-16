// Keybinding registry unit tests: parsing, platform normalization, matching, conflicts
import { describe, expect, it } from "vitest";

import {
  comboParts,
  createKeybindingRegistry,
  keybindingRegistry,
  matchEvent,
  normalizeCombo,
  parseCombo,
  platformLabel,
  SHELL_BINDING_DEFS,
  SHELL_RUNNER_BINDINGS,
  useShellStore,
} from "@/features/shell";

const noop = () => undefined;

describe("combo parsing", () => {
  it("parses modifier combos", () => {
    expect(parseCombo("Ctrl+B")).toEqual({
      key: "B",
      ctrl: true,
      alt: false,
      shift: false,
      meta: false,
    });
    expect(parseCombo("Shift+Alt+P")).toEqual({
      key: "P",
      ctrl: false,
      alt: true,
      shift: true,
      meta: false,
    });
  });

  it("throws on a combo without a key or with two keys", () => {
    expect(() => parseCombo("Ctrl+Shift")).toThrow(/no key/);
    expect(() => parseCombo("Ctrl+B+J")).toThrow(/multiple keys/);
  });

  it("normalizes Mod to platform modifiers", () => {
    expect(normalizeCombo("Mod+B", "mac")).toBe("Meta+B");
    expect(normalizeCombo("Mod+B", "other")).toBe("Ctrl+B");
  });

  it("renders platform-gloss combos", () => {
    expect(platformLabel("Mod+B", "mac")).toBe("⌘B");
    expect(platformLabel("Mod+B", "other")).toBe("Ctrl+B");
    expect(comboParts("Shift+?", "other")).toEqual(["Shift", "?"]);
    expect(comboParts("Shift+?", "mac")).toEqual(["⇧", "?"]);
  });
});

describe("matchEvent", () => {
  function keyEvent(init: KeyboardEventInit): KeyboardEvent {
    return new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...init });
  }

  it("matches Ctrl+B on non-mac platforms", () => {
    const event = keyEvent({ key: "b", ctrlKey: true });
    expect(matchEvent(event, "Mod+B", { platform: "other" })).toBe(true);
  });

  it("matches Meta+B on mac", () => {
    const event = keyEvent({ key: "b", metaKey: true });
    expect(matchEvent(event, "Mod+B", { platform: "mac" })).toBe(true);
  });

  it("rejects mismatched modifiers", () => {
    const event = keyEvent({ key: "b" });
    expect(matchEvent(event, "Mod+B", { platform: "other" })).toBe(false);
  });

  it("matches Shift+? for the question-mark chord", () => {
    const event = keyEvent({ key: "?", shiftKey: true });
    expect(matchEvent(event, "Shift+?", { platform: "other" })).toBe(true);
    const plain = keyEvent({ key: "?" });
    expect(matchEvent(plain, "Shift+?", { platform: "other" })).toBe(false);
  });

  it("ignores events targeted at inputs unless the binding opts in", () => {
    const input = document.createElement("input");
    const typed = keyEvent({ key: "b", ctrlKey: true });
    input.dispatchEvent(typed);
    expect(matchEvent(typed, "Mod+B", { platform: "other" })).toBe(false);
    expect(matchEvent(typed, "Mod+B", { platform: "other", allowInInput: true })).toBe(
      true,
    );
  });
});

describe("keybinding registry", () => {
  it("registers, lists, and unregisters bindings", () => {
    const registry = createKeybindingRegistry([
      { id: "a", combo: "Mod+B", scope: "global", description: "A", run: noop },
    ]);
    expect(registry.list()).toHaveLength(1);
    expect(registry.getById("a")?.description).toBe("A");
    registry.unregister("a");
    expect(registry.list()).toHaveLength(0);
    expect(registry.getById("a")).toBeNull();
  });

  it("throws on duplicate ids", () => {
    const registry = createKeybindingRegistry();
    registry.register({
      id: "a",
      combo: "Mod+B",
      scope: "global",
      description: "A",
      run: noop,
    });
    expect(() => {
      registry.register({
        id: "a",
        combo: "Alt+K",
        scope: "global",
        description: "A2",
        run: noop,
      });
    }).toThrow(/Duplicate binding id "a"/);
  });

  it("throws when two bindings share combo and scope", () => {
    const registry = createKeybindingRegistry();
    registry.register({
      id: "a",
      combo: "Shift+?",
      scope: "global",
      description: "A",
      run: noop,
    });
    expect(() => {
      registry.register({
        id: "b",
        combo: "Shift+?",
        scope: "global",
        description: "B",
        run: noop,
      });
    }).toThrow(/conflicts with "a"/);
  });

  it("allows the same combo in different scopes", () => {
    const registry = createKeybindingRegistry();
    registry.register({
      id: "a",
      combo: "Mod+B",
      scope: "global",
      description: "A",
      run: noop,
    });
    expect(() => {
      registry.register({
        id: "b",
        combo: "Mod+B",
        scope: "view",
        description: "B",
        run: noop,
      });
    }).not.toThrow();
    expect(registry.list()).toHaveLength(2);
  });

  it("ships the three documented shell shortcuts with working runners", () => {
    expect(keybindingRegistry.list()).toHaveLength(SHELL_BINDING_DEFS.length);
    const ids = keybindingRegistry.list().map((binding) => binding.id);
    expect(ids).toEqual(["toggle-sidebar", "toggle-panel", "open-shortcuts"]);
  });

  it("toggles the sidebar through the shipped runner", () => {
    const open = useShellStore.getState().sidebarOpen;
    keybindingRegistry.getById("toggle-sidebar")?.run();
    expect(useShellStore.getState().sidebarOpen).toBe(!open);
    useShellStore.getState().setSidebarOpen(open);
  });

  it("declares runner bindings for every definition", () => {
    expect(SHELL_RUNNER_BINDINGS).toHaveLength(SHELL_BINDING_DEFS.length);
    for (const binding of SHELL_RUNNER_BINDINGS)
      expect(binding.run).toBeTypeOf("function");
  });
});
