// Unit tests for the shared cn() classname helper
import { describe, expect, it } from "vitest";

import { cn } from "@/shared/lib/utils";

describe("cn", () => {
  it("filters falsy values and joins class strings", () => {
    const opts = { severe: false as boolean };

    expect(cn("px-2", opts.severe && "opacity-50", ["py-1"])).toBe("px-2 py-1");
  });

  it("merges conflicting Tailwind classes with the last one winning", () => {
    expect(cn("px-2", "px-4", "text-foreground text-foreground-muted")).toBe(
      "px-4 text-foreground-muted",
    );
  });
});
