// Keyboard shortcut reference dialog — rendered entirely from the keybinding registry
"use client";

import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Kbd,
} from "@/shared/ui";

import {
  comboParts,
  detectPlatform,
  keybindingRegistry,
  type Scope,
} from "../model/keybindings";
import { useShellStore } from "../model/shell-store";

const SCOPES: readonly Scope[] = ["global", "view"];
const SCOPE_LABELS: Record<Scope, string> = { global: "Global", view: "View" };

function ShortcutsDialog() {
  const open = useShellStore((state) => state.shortcutsDialogOpen);
  const setOpen = useShellStore((state) => state.setShortcutsDialogOpen);
  const platform = detectPlatform();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Shortcuts available in this session, sourced from the keybinding registry.
          </DialogDescription>
        </DialogHeader>
        <div className="flex max-h-72 flex-col gap-4 overflow-y-auto pr-1">
          {SCOPES.map((scope) => {
            const bindings = keybindingRegistry
              .list()
              .filter((binding) => binding.scope === scope);
            if (bindings.length === 0) return null;
            return (
              <div key={scope} className="flex flex-col gap-1">
                <h3 className="text-11 text-fg-muted font-mono tracking-widest uppercase">
                  {SCOPE_LABELS[scope]}
                </h3>
                {bindings.map((binding) => (
                  <div
                    key={binding.id}
                    className="flex items-center justify-between gap-4 py-0.5"
                  >
                    <span className="text-13 text-fg">{binding.description}</span>
                    <span className="flex shrink-0 items-center gap-0.5">
                      {comboParts(binding.normalizedCombo, platform).map((part) => (
                        <Kbd key={part}>{part}</Kbd>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary" size="sm">
              Done
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { ShortcutsDialog };
