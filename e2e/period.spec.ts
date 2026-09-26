import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test.describe("Period module", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("creates a new period", async ({ page }) => {
    await page.goto("/period");
    await expect(
      page.getByRole("heading", { name: /Academic period management/i }),
    ).toBeVisible();

    const label = `E2E Period ${Date.now()}`;
    await page.getByLabel(/Label/i).fill(label);
    await page
      .getByLabel(/School Year/i)
      .selectOption({ label: "E2E Year (ACTIVE)" });
    await page.getByLabel(/Start date/i).fill("2026-09-01");
    await page.getByLabel(/End date/i).fill("2026-12-20");
    await page.getByRole("button", { name: /Create period/i }).click();

    await expect(page.getByText(label)).toBeVisible();
  });

  test("shows end date validation error when before start date", async ({
    page,
  }) => {
    await page.goto("/period");
    await page.getByLabel(/Label/i).fill("Invalid period");
    await page.getByLabel(/Start date/i).fill("2026-12-20");
    await page.getByLabel(/End date/i).fill("2026-09-01");
    await page.getByRole("button", { name: /Create period/i }).click();
    await expect(
      page.getByText(/End date must be after start date/i),
    ).toBeVisible();
  });
});
