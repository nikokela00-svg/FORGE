// Component test for the boot screen: wordmark and version footer render
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BootScreen } from "@/features/boot";

describe("BootScreen", () => {
  it("renders the FORGE wordmark", () => {
    render(<BootScreen />);

    expect(screen.getByText(/FORGE/)).toBeInTheDocument();
  });

  it("renders the foundation version footer", () => {
    render(<BootScreen />);

    expect(screen.getByText("v0.1.0 — foundation")).toBeInTheDocument();
  });
});
