// Component tests for the Select primitive
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui";

describe("Select", () => {
  const setup = (onValueChange = vi.fn()) =>
    render(
      <Select onValueChange={onValueChange}>
        <SelectTrigger aria-label="Density">
          <SelectValue placeholder="Pick a density" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Densities</SelectLabel>
            <SelectItem value="sparse">Sparse</SelectItem>
            <SelectItem value="dense">Dense</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>,
    );

  it("opens the listbox on click and selects an item", async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();
    setup(onValueChange);
    const trigger = screen.getByRole("combobox", { name: "Density" });
    await user.click(trigger);
    const listbox = screen.getByRole("listbox");
    await user.click(within(listbox).getByText("Dense"));
    expect(onValueChange).toHaveBeenCalledWith("dense");
    expect(screen.getByText("Dense")).toBeInTheDocument();
  });

  it("labels the listbox group", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole("combobox", { name: "Density" }));
    expect(screen.getByRole("group", { name: "Densities" })).toBeInTheDocument();
  });
});
