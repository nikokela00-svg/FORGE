// Component tests for the empty editor: watermark and registry-driven shortcut hints
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EmptyEditor, keybindingRegistry } from "@/features/shell";
import { siteConfig } from "@/shared/config/site";

describe("EmptyEditor", () => {
  it("shows the FORGE watermark and tagline", () => {
    render(<EmptyEditor />);
    expect(screen.getByText(siteConfig.name)).toBeInTheDocument();
    expect(screen.getByText(siteConfig.tagline)).toBeInTheDocument();
  });

  it("lists every registry shortcut as a hint with key chips", () => {
    const view = render(<EmptyEditor />);
    const region = screen.getByRole("region", {
      name: `${siteConfig.name} — empty editor`,
    });
    const hints = keybindingRegistry.list().slice(0, 5);
    for (const binding of hints) {
      expect(within(region).getByText(binding.description)).toBeInTheDocument();
    }
    const expectedParts = hints.reduce(
      (total, binding) => total + binding.normalizedCombo.split("+").length,
      0,
    );
    expect(view.container.querySelectorAll("kbd").length).toBe(expectedParts);
  });
});
