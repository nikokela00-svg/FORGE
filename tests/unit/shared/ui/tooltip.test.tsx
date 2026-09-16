// Component tests for the Tooltip primitive
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui";

describe("Tooltip", () => {
  it("shows its content on hover and hides after the pointer leaves", async () => {
    const user = userEvent.setup();
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button>Save</Button>
          </TooltipTrigger>
          <TooltipContent>Persist changes</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );
    await user.hover(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(screen.getByRole("tooltip")).toHaveTextContent("Persist changes"),
    );
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("tooltip")).not.toBeInTheDocument());
  });
});
