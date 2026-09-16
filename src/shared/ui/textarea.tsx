// Multi-line textarea with the same token base as Input
import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/utils";

const textareaBase =
  "flex min-h-20 w-full rounded-md border border-border bg-surface-1 px-3 py-2 text-13 text-fg shadow-none transition-colors placeholder:text-fg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:border-focus-ring disabled:cursor-not-allowed disabled:opacity-50";

export type TextareaProps = ComponentProps<"textarea">;

function Textarea({ className, ...props }: TextareaProps) {
  return <textarea className={cn(textareaBase, className)} {...props} />;
}

Textarea.displayName = "Textarea";

export { Textarea };
