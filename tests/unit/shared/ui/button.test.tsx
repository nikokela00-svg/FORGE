// Component tests for Button and IconButton primitives
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button, IconButton } from "@/shared/ui";

describe("Button", () => {
  it("renders as a button with a safe default type", () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute(
      "type",
      "button",
    );
  });

  it("composes variant and size utility classes", () => {
    render(
      <Button variant="primary" size="sm">
        Save
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toHaveClass("bg-accent", "h-7", "text-accent-fg");
  });

  it("fires onClick", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={onClick}>Go</Button>);
    await user.click(screen.getByRole("button", { name: "Go" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("is inert when disabled", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <Button onClick={onClick} disabled>
        Go
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Go" });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("merges into the child element with asChild", () => {
    render(
      <Button asChild>
        <a href="/docs">Open docs</a>
      </Button>,
    );
    expect(screen.getByRole("link", { name: "Open docs" })).toHaveClass("inline-flex");
  });

  it("does not submit the surrounding form by default", async () => {
    const onSubmit = vi.fn((event: React.SyntheticEvent) => {
      event.preventDefault();
    });
    const user = userEvent.setup();
    render(
      <form onSubmit={onSubmit}>
        <Button>Submit</Button>
      </form>,
    );
    await user.click(screen.getByRole("button", { name: "Submit" }));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe("IconButton", () => {
  it("renders with an accessible name and square size", () => {
    render(<IconButton aria-label="Settings" size="md" />);
    const button = screen.getByRole("button", { name: "Settings" });
    expect(button).toHaveClass("size-8");
  });
});
