// Toast provider (Sonner) themed with design tokens, plus toast export
"use client";

import { useTheme } from "next-themes";
import type { ComponentProps } from "react";
import { toast, Toaster as Sonner } from "sonner";

type ToasterProps = ComponentProps<typeof Sonner>;

function Toaster({ ...props }: ToasterProps) {
  const { theme } = useTheme();
  const resolvedTheme = (theme ?? "dark") as "light" | "dark";
  return (
    <Sonner
      theme={resolvedTheme}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:rounded-md group-[.toaster]:border-border group-[.toaster]:bg-surface-3 group-[.toaster]:text-fg group-[.toaster]:shadow-e3",
          description: "group-[.toaster]:text-fg-muted",
          actionButton: "group-[.toaster]:bg-accent group-[.toaster]:text-accent-fg",
          cancelButton: "group-[.toaster]:bg-surface-2 group-[.toaster]:text-fg",
        },
      }}
      {...props}
    />
  );
}

Toaster.displayName = "Toaster";

export { toast, Toaster };
