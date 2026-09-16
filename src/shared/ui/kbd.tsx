// Keyboard shortcut chiclet — informational, never interactive
import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/utils";

function Kbd({ className, ...props }: ComponentProps<"kbd">) {
  return (
    <kbd
      className={cn(
        "border-border bg-surface-1 text-11 text-fg-muted shadow-e1 inline-flex h-5 items-center gap-1 rounded-sm border px-1.5 font-mono select-none",
        className,
      )}
      {...props}
    />
  );
}

Kbd.displayName = "Kbd";

export { Kbd };
