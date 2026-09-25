import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test.describe("SchoolYear module", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("shows the active school year", async ({ page }) => {
    await page.goto("/schoolYear");
    await expect(
      page.getByRole("heading", { name: /School year management/i }),
    ).toBeVisible();

    await expect(page.getByRole("heading", { name: "E2E Year" })).toBeVisible();
    await expect(page.getByText("Active", { exact: true })).toBeVisible();
  });
});
