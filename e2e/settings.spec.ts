import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test.describe("School Settings module", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("loads and updates school settings", async ({ page }) => {
    await page.goto("/settings");
    await expect(
      page.getByRole("heading", { name: /School settings/i }),
    ).toBeVisible();

    const name = `E2E School ${Date.now()}`;
    await page.getByLabel(/School Name/i).fill(name);
    await page.getByLabel(/Phone/i).fill("+237600000000");
    await page.getByLabel(/Address/i).fill("E2E Address");

    await page.getByRole("button", { name: /Save settings/i }).click();
    await expect(page.getByText(/Settings saved successfully/i)).toBeVisible();

    // Reload and verify persistence
    await page.reload();
    await expect(page.getByLabel(/School Name/i)).toHaveValue(name);
  });
});
