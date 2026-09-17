// E2e golden path — the static build boots into the FORGE workspace shell
import { expect, test } from "@playwright/test";

test("home page boots the FORGE workspace shell", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("region", { name: "FORGE — empty editor" })).toBeVisible();
  await expect(
    page.getByText("Local-first, AI-native developer workspace"),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Explorer" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Search" })).toBeVisible();
  await expect(page.getByText("v0.4.0")).toBeVisible();
  await expect(page.getByText("online")).toBeVisible();
});
