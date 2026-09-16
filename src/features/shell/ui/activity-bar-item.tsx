// Single activity-bar tab: icon button with active state, accessible label, and tooltip
"use client";

import type { LucideIcon } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { IconButton, Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui";

interface ActivityBarItemProps {
  icon: LucideIcon;
  label: string;
  active: boolean;
  onClick: () => void;
}

function ActivityBarItem({ icon: Icon, label, active, onClick }: ActivityBarItemProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <IconButton
          aria-label={label}
          aria-pressed={active}
          variant="ghost"
          size="md"
          className={cn(
            active
              ? "text-fg after:bg-accent relative after:pointer-events-none after:absolute after:inset-y-1 after:left-0 after:w-0.5 after:rounded-full"
              : "text-fg-muted",
          )}
          onClick={onClick}
        >
          <Icon className="size-4" aria-hidden="true" />
        </IconButton>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

export { ActivityBarItem };
export type { ActivityBarItemProps };
