// Accessible loading spinner that optionally announces a label
import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/utils";

export interface SpinnerProps extends ComponentProps<"span"> {
  label?: string;
}

function Spinner({ className, label, ...props }: SpinnerProps) {
  return (
    <span
      role="status"
      className={cn("inline-flex items-center gap-2", className)}
      {...props}
    >
      <span
        aria-hidden="true"
        className="border-border inline-block size-4 animate-spin rounded-full border-2 border-t-current"
      />
      {label !== undefined ? <span className="sr-only">{label}</span> : null}
    </span>
  );
}

Spinner.displayName = "Spinner";

export { Spinner };
