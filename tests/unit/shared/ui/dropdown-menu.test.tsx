// Component tests for the DropdownMenu primitive, including an axe audit
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui";

import { expectAccessible } from "../../../support/expect-accessible";

describe("DropdownMenu", () => {
  const setup = (
    onSelect = vi.fn(),
    onCheckedChange = vi.fn(),
    onThemeChange = vi.fn(),
  ) =>
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Project menu</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onSelect={onSelect}>Duplicate</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem checked onCheckedChange={onCheckedChange}>
            Show hidden files
          </DropdownMenuCheckboxItem>
          <DropdownMenuRadioGroup value="dark" onValueChange={onThemeChange}>
            <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

  it("opens on trigger click and fires onSelect when an item is picked", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    setup(onSelect);
    await user.click(screen.getByRole("button", { name: "Project menu" }));
    await user.click(screen.getByRole("menuitem", { name: "Duplicate" }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("exposes checkbox and radio item states", async () => {
    const themeChange = vi.fn();
    const user = userEvent.setup();
    setup(vi.fn(), vi.fn(), themeChange);
    await user.click(screen.getByRole("button", { name: "Project menu" }));
    expect(
      screen.getByRole("menuitemcheckbox", { name: "Show hidden files" }),
    ).toBeChecked();
    const dark = screen.getByRole("menuitemradio", { name: "Dark" });
    expect(dark).toBeChecked();
    await user.click(screen.getByRole("menuitemradio", { name: "Light" }));
    expect(themeChange).toHaveBeenCalledWith("light");
  });

  it("has no critical or serious accessibility violations when open", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole("button", { name: "Project menu" }));
    const menu = screen.getByRole("menu");
    await expectAccessible(menu);
  });
});
