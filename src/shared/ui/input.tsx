// Text input with semantic color token classes
import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/utils";

const inputBase =
  "flex h-8 w-full rounded-md border border-border bg-surface-1 px-3 text-13 text-fg shadow-none transition-colors placeholder:text-fg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:border-focus-ring disabled:cursor-not-allowed disabled:opacity-50 file:border-0 file:bg-transparent file:text-13 file:font-medium file:text-fg";

export type InputProps = ComponentProps<"input">;

function Input({ className, type = "text", ...props }: InputProps) {
  return <input type={type} className={cn(inputBase, className)} {...props} />;
}

Input.displayName = "Input";

export { Input };
