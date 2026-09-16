// Component tests for the activity bar: view switching, active state, terminal toggle
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { useShellStore } from "@/features/shell";
import { ActivityBar } from "@/features/shell";

describe("ActivityBar", () => {
  beforeEach(() => {
    useShellStore.setState({
      activeView: "files",
      sidebarOpen: true,
      sidebarSize: 260,
      panelOpen: true,
      panelSize: 200,
      shortcutsDialogOpen: false,
    });
  });

  it("renders one toggle per view plus the terminal toggle", () => {
    render(<ActivityBar />);
    for (const label of [
      "Explorer",
      "Search",
      "Source Control",
      "Extensions",
      "Hide terminal",
    ]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
  });

  it("marks the active view as pressed", () => {
    render(<ActivityBar />);
    expect(screen.getByRole("button", { name: "Explorer" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "Search" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("switches the active view on click", async () => {
    const user = userEvent.setup();
    render(<ActivityBar />);
    await user.click(screen.getByRole("button", { name: "Source Control" }));
    expect(useShellStore.getState().activeView).toBe("source-control");
  });

  it("collapses the sidebar when the active view is clicked again", async () => {
    const user = userEvent.setup();
    render(<ActivityBar />);
    await user.click(screen.getByRole("button", { name: "Explorer" }));
    expect(useShellStore.getState().sidebarOpen).toBe(false);
  });

  it("toggles the terminal panel", async () => {
    const user = userEvent.setup();
    render(<ActivityBar />);
    await user.click(screen.getByRole("button", { name: "Hide terminal" }));
    expect(useShellStore.getState().panelOpen).toBe(false);
    expect(screen.getByRole("button", { name: "Show terminal" })).toBeInTheDocument();
  });
});
