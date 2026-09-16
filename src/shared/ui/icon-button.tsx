// Square icon-only button sharing the base button variant palette
"use client";

import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/utils";

const iconButtonVariants = cva(
  "inline-flex items-center justify-center rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0 [&_svg]:size-4",
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-accent-fg shadow-e1 hover:bg-accent-hover active:bg-accent-active",
        secondary: "border border-border bg-surface-2 text-fg hover:bg-surface-3",
        ghost: "text-fg-muted hover:bg-surface-1 hover:text-fg",
        outline:
          "border border-border-strong bg-transparent text-fg hover:border-fg-subtle hover:bg-surface-1",
        danger: "border border-danger/30 bg-danger-muted text-danger hover:bg-danger/10",
      },
      size: {
        xs: "size-6",
        sm: "size-7",
        md: "size-8",
        lg: "size-9",
      },
    },
    defaultVariants: {
      variant: "ghost",
      size: "md",
    },
  },
);

export interface IconButtonProps
  extends ComponentProps<"button">, VariantProps<typeof iconButtonVariants> {}

function IconButton({
  className,
  variant,
  size,
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      className={cn(iconButtonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

IconButton.displayName = "IconButton";

export { IconButton, iconButtonVariants };
