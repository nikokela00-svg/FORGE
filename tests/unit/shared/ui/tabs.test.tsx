// Component tests for the Tabs primitive
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui";

describe("Tabs", () => {
  const setup = () =>
    render(
      <Tabs defaultValue="overview">
        <TabsList aria-label="Project sections">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">Overview panel</TabsContent>
        <TabsContent value="activity">Activity panel</TabsContent>
      </Tabs>,
    );

  it("switches the visible panel when a tab is clicked", async () => {
    const user = userEvent.setup();
    setup();
    const activity = screen.getByRole("tab", { name: "Activity" });
    expect(screen.getByRole("tabpanel", { name: "Overview" })).toBeVisible();
    expect(screen.queryByRole("tabpanel", { name: "Activity" })).not.toBeInTheDocument();
    await user.click(activity);
    expect(activity).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel", { name: "Activity" })).toBeVisible();
  });

  it("supports arrow-key navigation between tabs", async () => {
    const user = userEvent.setup();
    setup();
    const overview = screen.getByRole("tab", { name: "Overview" });
    overview.focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Activity" })).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(overview).toHaveFocus();
  });
});
