import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test.describe("Class module", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("creates a new class", async ({ page }) => {
    await page.goto("/class");
    await expect(
      page.getByRole("heading", { name: /Class management/i }),
    ).toBeVisible();

    const name = `E2E Class ${Date.now()}`;
    await page.getByLabel(/Name \(Class Name\)/i).fill(name);
    await page.getByLabel(/Level \(Grade\/Level\)/i).fill("E2E Level");
    await page.getByRole("button", { name: /Create class/i }).click();

    await expect(page.getByText(name)).toBeVisible();
    await expect(page.getByText(/Class created successfully/i)).toBeVisible();
  });

  test("shows validation errors on empty submit", async ({ page }) => {
    await page.goto("/class");
    await page.getByRole("button", { name: /Create class/i }).click();
    await expect(page.getByText(/Name is required/i)).toBeVisible();
    await expect(page.getByText(/Level is required/i)).toBeVisible();
  });
});
