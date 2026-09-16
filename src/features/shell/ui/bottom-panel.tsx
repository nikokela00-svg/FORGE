// Terminal frame placeholder — a real terminal lands in a later phase, layout ships now
"use client";

import { ChevronDown } from "lucide-react";

import { IconButton, Kbd } from "@/shared/ui";

import { detectPlatform, platformLabel } from "../model/keybindings";
import { useShellStore } from "../model/shell-store";

function BottomPanel() {
  const togglePanel = useShellStore((state) => state.togglePanel);
  const shortcut = platformLabel("Mod+J", detectPlatform());

  return (
    <section aria-label="Terminal" className="flex h-full min-h-0 flex-col">
      <header className="border-border flex h-7 shrink-0 items-center gap-2 border-b px-3">
        <h2 className="text-11 text-fg-muted font-mono tracking-widest uppercase">
          Terminal
        </h2>
        <div className="ml-auto flex items-center gap-2">
          <Kbd>{shortcut}</Kbd>
          <IconButton
            variant="ghost"
            size="sm"
            aria-label="Close terminal panel"
            onClick={togglePanel}
          >
            <ChevronDown className="size-4" />
          </IconButton>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 items-center justify-center p-4">
        <p className="text-12 text-fg-subtle text-center">
          A real terminal lands here later — the panel layout ships with the shell.
        </p>
      </div>
    </section>
  );
}

export { BottomPanel };
