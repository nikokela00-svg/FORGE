// Radix tooltip with standard delay, theme-aligned content styling
"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/utils";

function TooltipProvider({ ...props }: ComponentProps<typeof TooltipPrimitive.Provider>) {
  return <TooltipPrimitive.Provider delayDuration={400} {...props} />;
}

function Tooltip({ ...props }: ComponentProps<typeof TooltipPrimitive.Root>) {
  return <TooltipPrimitive.Root {...props} />;
}

function TooltipTrigger({ ...props }: ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger {...props} />;
}

function TooltipContent({
  className,
  sideOffset = 4,
  ...props
}: ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Content
      sideOffset={sideOffset}
      className={cn(
        "z-tooltip animate-in fade-in-0 zoom-in-95 border-border bg-surface-3 text-11 text-fg shadow-e2 overflow-hidden rounded-md border px-2 py-1.5",
        className,
      )}
      {...props}
    />
  );
}

function TooltipArrow({
  className,
  ...props
}: ComponentProps<typeof TooltipPrimitive.Arrow>) {
  return (
    <TooltipPrimitive.Arrow className={cn("fill-surface-3", className)} {...props} />
  );
}

TooltipContent.displayName = "TooltipContent";
TooltipArrow.displayName = "TooltipArrow";

export { Tooltip, TooltipArrow, TooltipContent, TooltipProvider, TooltipTrigger };
