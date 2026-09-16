// Watermark placeholder for the editor panel — presents branding and registry-driven shortcut hints
"use client";

import { siteConfig } from "@/shared/config/site";
import { Kbd } from "@/shared/ui";

import { comboParts, detectPlatform } from "../model/keybindings";
import { keybindingRegistry } from "../model/keybindings";

const HINT_LIMIT = 5;

function EmptyEditor() {
  const platform = detectPlatform();
  const hints = keybindingRegistry.list().slice(0, HINT_LIMIT);

  return (
    <div
      role="region"
      aria-label={`${siteConfig.name} — empty editor`}
      className="flex h-full min-h-0 flex-col items-center justify-center p-8"
    >
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <p className="font-mono text-5xl font-semibold tracking-tight select-none">
          {siteConfig.name}
          <span aria-hidden="true" className="text-accent">
            ▍
          </span>
        </p>
        <p className="text-13 text-fg-subtle">{siteConfig.tagline}</p>
        <ul className="flex w-full flex-col gap-2">
          {hints.map((binding) => (
            <li key={binding.id} className="flex items-center justify-between gap-4">
              <span className="text-12 text-fg-muted text-left">
                {binding.description}
              </span>
              <span className="flex shrink-0 items-center gap-0.5">
                {comboParts(binding.normalizedCombo, platform).map((part) => (
                  <Kbd key={part}>{part}</Kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export { EmptyEditor };
