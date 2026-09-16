// Status badge with muted color wash variants
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-11 font-medium leading-none",
  {
    variants: {
      variant: {
        default: "border-border bg-surface-2 text-fg-muted",
        outline: "border-border-strong text-fg-muted",
        success: "border-success/30 bg-success-muted text-success",
        warning: "border-warning/30 bg-warning-muted text-warning",
        danger: "border-danger/30 bg-danger-muted text-danger",
        info: "border-info/30 bg-info-muted text-info",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends ComponentProps<"span">, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

Badge.displayName = "Badge";

export { Badge, badgeVariants };
