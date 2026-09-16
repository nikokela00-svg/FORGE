// Typed classname combiner for conditional Tailwind styles
import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Our semantic scales use dotted names (text-12, bg-surface-2, shadow-e1) that
// tailwind-merge's catch-all validators classify as generic colors/shadows and
// then merge (drop) incorrectly — e.g. `text-12` ate `text-accent-fg` on the
// primary button. Re-register the affected groups with explicit literal lists
// so type scale, colors, shadows, and z-index resolve to distinct conflict
// groups. Anything left unregistered falls through as "kept" (safe failure).
const fontSizes = [
  "base",
  "xs",
  "sm",
  "lg",
  "xl",
  "2xl",
  "3xl",
  "4xl",
  "5xl",
  "6xl",
  "7xl",
  "8xl",
  "9xl",
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "18",
  "20",
  "24",
  "28",
  "32",
] as const;

const textColors = [
  "bg",
  "fg",
  "fg-muted",
  "fg-subtle",
  "accent",
  "accent-fg",
  "danger",
  "danger-muted",
  "info",
  "info-muted",
  "success",
  "success-muted",
  "warning",
  "warning-muted",
] as const;

const bgColors = [
  "accent",
  "accent-hover",
  "accent-active",
  "danger",
  "danger-muted",
  "focus-ring",
  "info",
  "info-muted",
  "overlay",
  "success",
  "success-muted",
  "surface-1",
  "surface-2",
  "surface-3",
  "warning",
  "warning-muted",
] as const;

const borderColors = [
  "border",
  "danger",
  "info",
  "strong",
  "success",
  "warning",
] as const;

const twMerge = extendTailwindMerge((config) => ({
  ...config,
  classGroups: {
    ...config.classGroups,
    "font-size": [{ text: fontSizes }],
    "text-color": [{ text: textColors }],
    "bg-color": [{ bg: bgColors }],
    "border-color": [{ border: borderColors }],
    shadow: [{ shadow: ["e1", "e2", "e3"] }],
    "z-index": [
      { z: ["base", "modal", "overlay", "popover", "sticky", "toast", "tooltip"] },
    ],
  },
}));

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
