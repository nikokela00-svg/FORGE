// E2e axe scan — dev-only design-system showcase page
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const DEV_BASE_URL = "http://localhost:3000";

test.use({ baseURL: DEV_BASE_URL });

const criticalOrSerious = (results: Awaited<ReturnType<AxeBuilder["analyze"]>>) =>
  results.violations.filter(
    (violation) => violation.impact === "critical" || violation.impact === "serious",
  );

test("design system page renders without critical or serious axe violations", async ({
  page,
}) => {
  await page.goto("/design-system");

  await expect(page.getByRole("heading", { name: "Design system" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Primary" })).toBeVisible();

  const results = await new AxeBuilder({ page })
    .disableRules(["color-contrast"])
    .analyze();

  expect(criticalOrSerious(results)).toEqual([]);
});

test("dialog overlay is accessible while open", async ({ page }) => {
  await page.goto("/design-system");

  await page.getByRole("button", { name: "New workspace" }).click();
  await expect(page.getByRole("dialog", { name: "New workspace" })).toBeVisible();

  const results = await new AxeBuilder({ page }).include('[role="dialog"]').analyze();

  expect(criticalOrSerious(results)).toEqual([]);
});
