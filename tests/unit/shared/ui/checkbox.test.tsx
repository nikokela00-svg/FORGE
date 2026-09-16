// Component tests for the Checkbox primitive
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Checkbox, Label } from "@/shared/ui";

describe("Checkbox", () => {
  it("toggles between unchecked and checked on click", async () => {
    const onCheckedChange = vi.fn();
    const user = userEvent.setup();
    render(<Checkbox id="terms" onCheckedChange={onCheckedChange} aria-label="Agree" />);
    const checkbox = screen.getByRole("checkbox", { name: "Agree" });
    expect(checkbox).not.toBeChecked();
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();
    expect(onCheckedChange).toHaveBeenLastCalledWith(false);
  });

  it("can be associated with a visible label", () => {
    render(
      <>
        <Label htmlFor="remember">Remember me</Label>
        <Checkbox id="remember" />
      </>,
    );
    expect(screen.getByLabelText("Remember me")).toBeInTheDocument();
  });

  it("is inert when disabled", async () => {
    const onCheckedChange = vi.fn();
    const user = userEvent.setup();
    render(<Checkbox disabled onCheckedChange={onCheckedChange} aria-label="Agree" />);
    const checkbox = screen.getByRole("checkbox", { name: "Agree" });
    await user.click(checkbox);
    expect(onCheckedChange).not.toHaveBeenCalled();
    expect(checkbox).toBeDisabled();
  });
});
