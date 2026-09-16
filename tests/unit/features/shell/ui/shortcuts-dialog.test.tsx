// Component tests for the shortcuts dialog: registry-driven rows and close behavior
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { keybindingRegistry, useShellStore } from "@/features/shell";
import { ShortcutsDialog } from "@/features/shell";

describe("ShortcutsDialog", () => {
  beforeEach(() => {
    useShellStore.setState({ shortcutsDialogOpen: true });
  });

  it("renders every binding description from the registry", () => {
    render(<ShortcutsDialog />);
    const dialog = screen.getByRole("dialog");
    for (const binding of keybindingRegistry.list()) {
      expect(within(dialog).getByText(binding.description)).toBeInTheDocument();
    }
  });

  it("renders a key chip for every combo part", () => {
    render(<ShortcutsDialog />);
    const expectedParts = keybindingRegistry
      .list()
      .reduce((total, binding) => total + binding.normalizedCombo.split("+").length, 0);
    expect(document.querySelectorAll("kbd").length).toBe(expectedParts);
  });

  it("closes through Done and updates the store", async () => {
    const user = userEvent.setup();
    render(<ShortcutsDialog />);
    await user.click(screen.getByRole("button", { name: "Done" }));
    expect(useShellStore.getState().shortcutsDialogOpen).toBe(false);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
