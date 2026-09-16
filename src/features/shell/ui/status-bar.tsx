// Status bar — aggregated contributions, theme mirror, online state, version
"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Fragment, useEffect, useState } from "react";

import { siteConfig } from "@/shared/config/site";
import { cn } from "@/shared/lib/utils";

import { useShellStore } from "../model/shell-store";
import { useStatusRegistry } from "../model/status-registry";

function useOnline(): boolean {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    if (typeof window === "undefined" || !("onLine" in navigator)) return;
    const apply = () => {
      setOnline(navigator.onLine);
    };
    apply();
    window.addEventListener("online", apply);
    window.addEventListener("offline", apply);
    return () => {
      window.removeEventListener("online", apply);
      window.removeEventListener("offline", apply);
    };
  }, []);
  return online;
}

function ThemeMirror() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme !== "light";
  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className="text-fg-muted hover:text-fg focus-visible:ring-focus-ring inline-flex h-4.5 items-center gap-1 rounded-sm px-1 transition-colors focus-visible:ring-2 focus-visible:outline-none"
      onClick={() => {
        setTheme(isDark ? "light" : "dark");
      }}
    >
      {isDark ? <Moon className="size-3.5" /> : <Sun className="size-3.5" />}
    </button>
  );
}

function StatusBar() {
  const items = useStatusRegistry();
  const openShortcuts = useShellStore((state) => state.setShortcutsDialogOpen);
  const online = useOnline();

  return (
    <footer
      role="contentinfo"
      className="bg-surface-1 text-11 text-fg-muted border-border flex h-5.5 shrink-0 items-center gap-1 border-t px-2"
    >
      {items.map((item) => (
        <Fragment key={item.id}>{item.node}</Fragment>
      ))}
      <div className="ml-auto flex items-center gap-1">
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className={cn("size-2 rounded-full", online ? "bg-success" : "bg-danger")}
          />
          <span className={online ? "text-fg-muted" : "text-fg"}>
            {online ? "online" : "offline"}
          </span>
        </span>
        <ThemeMirror />
        <button
          type="button"
          aria-label="Open keyboard shortcuts"
          className="hover:bg-surface-2 hover:text-fg focus-visible:ring-focus-ring inline-flex h-4.5 items-center gap-1 rounded-sm px-1 transition-colors focus-visible:ring-2 focus-visible:outline-none"
          onClick={() => {
            openShortcuts(true);
          }}
        >
          Press ?
        </button>
        <span className="text-fg-subtle">v{siteConfig.version}</span>
      </div>
    </footer>
  );
}

export { StatusBar };
