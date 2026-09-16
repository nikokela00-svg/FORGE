// Primary/secondary/ghost/outline/danger button with cva-driven variants
"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-13 font-medium transition-colors focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
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
        xs: "h-6 px-2 text-11",
        sm: "h-7 px-2.5 text-12",
        md: "h-8 px-3 text-13",
        lg: "h-9 px-4 text-14",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

function Button({
  className,
  variant,
  size,
  asChild = false,
  type = "button",
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

Button.displayName = "Button";

export { Button, buttonVariants };
