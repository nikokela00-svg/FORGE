// Animated loading skeleton placeholder
import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/utils";

function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div className={cn("bg-surface-2 animate-pulse rounded-md", className)} {...props} />
  );
}

Skeleton.displayName = "Skeleton";

export { Skeleton };
