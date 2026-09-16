// Component tests for Input, Textarea, and Label primitives
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Input, Label, Textarea } from "@/shared/ui";

describe("Input", () => {
  it("accepts typed values", async () => {
    const user = userEvent.setup();
    render(<Input aria-label="Project name" />);
    const input = screen.getByRole("textbox", { name: "Project name" });
    await user.type(input, "forge");
    expect(input).toHaveValue("forge");
  });

  it("passes through invalid state for form clients", () => {
    render(<Input aria-label="Email" aria-invalid />);
    expect(screen.getByRole("textbox", { name: "Email" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("is inert when disabled", () => {
    render(<Input aria-label="Name" disabled />);
    expect(screen.getByRole("textbox", { name: "Name" })).toBeDisabled();
  });
});

describe("Textarea", () => {
  it("accepts typed values", async () => {
    const user = userEvent.setup();
    render(<Textarea aria-label="Description" />);
    const textarea = screen.getByRole("textbox", { name: "Description" });
    await user.type(textarea, "a workspace");
    expect(textarea).toHaveValue("a workspace");
  });
});

describe("Label", () => {
  it("associates with its control by htmlFor", () => {
    render(
      <>
        <Label htmlFor="project-name">Project name</Label>
        <Input id="project-name" />
      </>,
    );
    expect(screen.getByLabelText("Project name")).toBeInTheDocument();
  });
});
