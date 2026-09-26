import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test.describe("Assignment module", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("creates a new assignment selecting a teacher", async ({ page }) => {
    await page.goto("/assignment");
    await expect(
      page.getByRole("heading", { name: /Assignment management/i }),
    ).toBeVisible();

    await page.getByLabel(/Teacher/i).selectOption({ label: "Teacher2 Two" });
    await page.getByLabel(/Class/i).selectOption({ label: "E2E Class (E2E)" });
    await page
      .getByLabel(/Course/i)
      .selectOption({ label: "E2E Course (E2E-1)" });
    await page
      .getByLabel(/School Year/i)
      .selectOption({ label: "E2E Year (ACTIVE)" });

    await page.getByRole("button", { name: /Create assignment/i }).click();

    await expect(
      page.getByText(/Assignment created successfully/i),
    ).toBeVisible();
  });

  test("blocks duplicate assignment with conflict error", async ({ page }) => {
    await page.goto("/assignment");
    await page.getByLabel(/Teacher/i).selectOption({ label: "Teacher1 One" });
    await page.getByLabel(/Class/i).selectOption({ label: "E2E Class (E2E)" });
    await page
      .getByLabel(/Course/i)
      .selectOption({ label: "E2E Course (E2E-1)" });
    await page
      .getByLabel(/School Year/i)
      .selectOption({ label: "E2E Year (ACTIVE)" });
    await page.getByRole("button", { name: /Create assignment/i }).click();

    await expect(page.getByText(/already exists/i)).toBeVisible();
  });
});
