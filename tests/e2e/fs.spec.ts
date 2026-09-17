// E2e file system spec — demo workspace, persistence across reload, deletion, status bar, axe
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const criticalOrSerious = (results: Awaited<ReturnType<AxeBuilder["analyze"]>>) =>
  results.violations.filter(
    (violation) => violation.impact === "critical" || violation.impact === "serious",
  );

test("demo workspace renders entries, persists across reload, and survives deletion", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Create Demo Workspace" }).click();
  await expect(page.getByRole("button", { name: "Delete package.json" })).toBeVisible();
  await expect(page.getByText("README.md")).toBeVisible();

  await page.reload();
  await expect(page.getByRole("button", { name: "Delete package.json" })).toBeVisible();
  await expect(page.getByText("README.md")).toBeVisible();

  const trash = page.getByRole("button", { name: "Delete package.json" });
  await trash.click();
  const dialog = page.getByRole("dialog", { name: "Delete package.json?" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Delete" }).click();

  await expect(page.getByRole("button", { name: "Delete package.json" })).toBeHidden();
  await expect(page.getByText("README.md")).toBeVisible();

  await page.reload();
  await expect(page.getByRole("button", { name: "Delete package.json" })).toBeHidden();
  await expect(page.getByText("README.md")).toBeVisible();
});

test("status bar shows the active workspace name", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Create Demo Workspace" }).click();
  await expect(page.getByLabel("Workspace: My Project")).toBeVisible();
});

test("files view exposes the open-folder keybinding in the shortcuts dialog", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("region", { name: "FORGE — empty editor" })).toBeVisible();

  await page.keyboard.press("Shift+?");
  const dialog = page.getByRole("dialog", { name: "Keyboard Shortcuts" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Open folder as workspace")).toBeVisible();
});

test("files view has no critical or serious axe violations", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Create Demo Workspace" }).click();
  await expect(page.getByRole("button", { name: "Delete package.json" })).toBeVisible();

  const results = await new AxeBuilder({ page })
    .include("body")
    .disableRules(["color-contrast"])
    .analyze();

  expect(criticalOrSerious(results)).toEqual([]);
});

test("delete dialog is accessible while open", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Create Demo Workspace" }).click();
  await page.getByRole("button", { name: "Delete README.md" }).click();
  const dialog = page.getByRole("dialog", { name: "Delete README.md?" });
  await expect(dialog).toBeVisible();

  const results = await new AxeBuilder({ page }).include('[role="dialog"]').analyze();
  expect(criticalOrSerious(results)).toEqual([]);
});
