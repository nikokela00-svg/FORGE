// Global keyboard dispatch — the registry is the single source of truth for combos
"use client";

import { useEffect } from "react";

import { keybindingRegistry, matchEvent } from "../model/keybindings";

function useShellShortcuts(): void {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      for (const binding of keybindingRegistry.list()) {
        if (
          matchEvent(event, binding.normalizedCombo, {
            allowInInput: binding.allowInInput ?? false,
          })
        ) {
          event.preventDefault();
          binding.run();
          return;
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);
}

export { useShellShortcuts };
