// Drift guard: docs/KEYBINDINGS.md must stay in sync with the keybinding registry
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { keybindingRegistry } from "@/features/shell";

function documentedIds(): string[] {
  const content = readFileSync(join(process.cwd(), "docs", "KEYBINDINGS.md"), "utf8");
  const ids = content
    .split("\n")
    .map((line) => line.match(/^\|\s*([a-z-]+)\s*\|/)?.[1])
    .filter((id): id is string => id !== undefined && id !== "ID" && !/^-+$/.test(id));
  return [...new Set(ids)];
}

describe("keybindings docs drift guard", () => {
  it("documents every id in the registry", () => {
    const docs = new Set(documentedIds());
    for (const binding of keybindingRegistry.list()) {
      expect(docs.has(binding.id)).toBe(true);
    }
  });

  it("registers every id documented in KEYBINDINGS.md", () => {
    for (const id of documentedIds()) {
      expect(keybindingRegistry.getById(id)).not.toBeNull();
    }
  });
});
