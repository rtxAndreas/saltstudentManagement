import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test.describe("Course module", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("creates a new course", async ({ page }) => {
    await page.goto("/course");
    await expect(
      page.getByRole("heading", { name: /Course management/i }),
    ).toBeVisible();

    const code = `E2E${Date.now()}`;
    await page.getByLabel(/Name \(Course Name\)/i).fill(`E2E Course ${code}`);
    await page.getByLabel(/Code \(Course Code\)/i).fill(code);
    await page.getByLabel(/Coefficient/i).fill("4");
    await page.getByRole("button", { name: /Create course/i }).click();

    await expect(page.getByText(code, { exact: true })).toBeVisible();
    await expect(page.getByText(/Course created successfully/i)).toBeVisible();
  });

  test("shows validation errors on empty submit", async ({ page }) => {
    await page.goto("/course");
    await page.getByRole("button", { name: /Create course/i }).click();
    await expect(page.getByText(/Name is required/i)).toBeVisible();
    await expect(page.getByText(/Code is required/i)).toBeVisible();
  });
});
