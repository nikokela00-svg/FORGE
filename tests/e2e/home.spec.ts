// E2e smoke test — the boot screen renders on the home page
import { expect, test } from "@playwright/test";

test("home page renders the FORGE boot screen", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText(/FORGE/)).toBeVisible();
  await expect(page.getByText("v0.1.0 — foundation")).toBeVisible();
});
