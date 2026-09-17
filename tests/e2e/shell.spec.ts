// E2e shell spec — keyboard shortcuts, view switching, terminal toggle, axe scans
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const criticalOrSerious = (results: Awaited<ReturnType<AxeBuilder["analyze"]>>) =>
  results.violations.filter(
    (violation) => violation.impact === "critical" || violation.impact === "serious",
  );

test("toggles the sidebar and terminal with keyboard shortcuts", async ({ page }) => {
  await page.goto("/");

  const sidebar = page.getByRole("complementary", { name: "Explorer" });
  const terminal = page.getByRole("region", { name: "Terminal" });

  await expect(sidebar).toBeVisible();

  await page.keyboard.press("Control+B");
  await expect(sidebar).toBeHidden();
  await page.keyboard.press("Control+B");
  await expect(sidebar).toBeVisible();

  await page.keyboard.press("Control+J");
  await expect(terminal).toBeHidden();
  await expect(page.getByRole("button", { name: "Show terminal" })).toBeVisible();
  await page.keyboard.press("Control+J");
  await expect(terminal).toBeVisible();
});

test("switches views from the activity bar", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Search" }).click();
  await expect(page.getByRole("complementary", { name: "Search" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Search" })).toBeVisible();

  await page.getByRole("button", { name: "Explorer" }).click();
  await expect(page.getByRole("complementary", { name: "Explorer" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Explorer" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("opens keyboard shortcuts with Shift+? and closes via Done", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("region", { name: "FORGE — empty editor" })).toBeVisible();

  await page.keyboard.press("Shift+?");
  const dialog = page.getByRole("dialog", { name: "Keyboard Shortcuts" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Toggle sidebar")).toBeVisible();
  await expect(dialog.getByText("Toggle terminal panel")).toBeVisible();
  await expect(dialog.getByText("Open keyboard shortcuts")).toBeVisible();

  await dialog.getByRole("button", { name: "Done" }).click();
  await expect(dialog).toBeHidden();
});

test("shell has no critical or serious axe violations", async ({ page }) => {
  await page.goto("/");

  const results = await new AxeBuilder({ page })
    .include("body")
    .disableRules(["color-contrast"])
    .analyze();

  expect(criticalOrSerious(results)).toEqual([]);
});

test("shortcuts dialog is accessible while open", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("region", { name: "FORGE — empty editor" })).toBeVisible();

  await page.keyboard.press("Shift+?");
  await expect(page.getByRole("dialog", { name: "Keyboard Shortcuts" })).toBeVisible();

  const results = await new AxeBuilder({ page }).include('[role="dialog"]').analyze();

  expect(criticalOrSerious(results)).toEqual([]);
});
