// E2e file explorer spec — demo tree, inline create/rename, context menus, drag-and-drop, persistence, axe
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const criticalOrSerious = (results: Awaited<ReturnType<AxeBuilder["analyze"]>>) =>
  results.violations.filter(
    (violation) => violation.impact === "critical" || violation.impact === "serious",
  );

test("demo workspace lists files, expands directories, and persists across reload", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Create Demo Workspace" }).click();
  const packageRow = page.getByRole("treeitem", { name: "package.json" });
  await expect(packageRow).toBeVisible();
  await expect(page.getByRole("treeitem", { name: "README.md" })).toBeVisible();

  await page.getByRole("button", { name: "Expand src" }).click();
  await expect(page.getByRole("treeitem", { name: "index.ts" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Expand lib" })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("treeitem", { name: "package.json" })).toBeVisible();
  await page.getByRole("button", { name: "Expand src" }).click();
  await expect(page.getByRole("treeitem", { name: "index.ts" })).toBeVisible();
});

test("creates and renames a file through the toolbar and F2", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Create Demo Workspace" }).click();
  await expect(page.getByRole("treeitem", { name: "package.json" })).toBeVisible();

  await page.getByRole("button", { name: "New File" }).click();
  const createInput = page.getByRole("textbox", { name: "New file name" });
  await expect(createInput).toBeVisible();
  await createInput.fill("notes.txt");
  await createInput.press("Enter");
  await expect(page.getByRole("treeitem", { name: "notes.txt" })).toBeVisible();

  await page.getByRole("treeitem", { name: "notes.txt" }).click();
  await page.keyboard.press("F2");
  const renameInput = page.getByRole("textbox", { name: "Rename item" });
  await expect(renameInput).toHaveValue("notes.txt");
  await renameInput.fill("journal.md");
  await renameInput.press("Enter");
  await expect(page.getByRole("treeitem", { name: "journal.md" })).toBeVisible();
  await expect(page.getByRole("treeitem", { name: "notes.txt" })).toBeHidden();
});

test("moves a file into a directory by drag and drop", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Create Demo Workspace" }).click();
  await expect(page.getByRole("treeitem", { name: "README.md" })).toBeVisible();

  const readme = page.getByRole("treeitem", { name: "README.md" });
  const src = page.getByRole("treeitem", { name: "src" });
  await readme.dragTo(src);

  await page.getByRole("button", { name: "Expand src" }).click();
  await expect(page.getByRole("treeitem", { name: "README.md" })).toBeVisible();
  await page.getByRole("button", { name: "Collapse src" }).click();
});

test("copies the focused item path to the clipboard from the context menu", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Create Demo Workspace" }).click();
  await expect(page.getByRole("treeitem", { name: "src" })).toBeVisible();

  await page.getByRole("treeitem", { name: "src" }).click({ button: "right" });
  await page.getByRole("menuitem", { name: "Copy Path" }).click();
  await expect(page.getByText("Copied /src")).toBeVisible();
});

test("deletes a file through the context menu and survives reload", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Create Demo Workspace" }).click();
  await expect(page.getByRole("treeitem", { name: "README.md" })).toBeVisible();

  await page.getByRole("treeitem", { name: "README.md" }).click({ button: "right" });
  await page.getByRole("menuitem", { name: "Delete" }).click();
  const dialog = page.getByRole("dialog", { name: "Delete README.md?" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Delete" }).click();

  await expect(page.getByRole("treeitem", { name: "README.md" })).toBeHidden();
  await page.reload();
  await expect(page.getByRole("treeitem", { name: "README.md" })).toBeHidden();
  await expect(page.getByRole("treeitem", { name: "package.json" })).toBeVisible();
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
  await expect(page.getByRole("treeitem", { name: "package.json" })).toBeVisible();

  const results = await new AxeBuilder({ page })
    .include("body")
    .disableRules(["color-contrast"])
    .analyze();

  expect(criticalOrSerious(results)).toEqual([]);
});

test("delete dialog is accessible while open", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Create Demo Workspace" }).click();
  await page.getByRole("treeitem", { name: "README.md" }).click({ button: "right" });
  await page.getByRole("menuitem", { name: "Delete" }).click();
  const dialog = page.getByRole("dialog", { name: "Delete README.md?" });
  await expect(dialog).toBeVisible();

  const results = await new AxeBuilder({ page }).include('[role="dialog"]').analyze();
  expect(criticalOrSerious(results)).toEqual([]);
});
