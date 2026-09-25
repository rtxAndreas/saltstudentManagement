import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test.describe("User module", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("creates a new instructor user", async ({ page }) => {
    await page.goto("/users/add");
    await expect(
      page.getByRole("heading", { name: /Create User/i }),
    ).toBeVisible();

    const ts = Date.now();
    await page.getByLabel(/First Name \/ Name/i).fill(`Instructor${ts}`);
    await page.getByLabel(/Lastname/i).fill("Test");
    await page.getByLabel(/Contact/i).fill("+237600000000");
    await page.getByLabel(/Email/i).fill(`instructor${ts}@test.com`);
    await page.getByLabel(/Role/i).selectOption("INSTRUCTOR");
    await page
      .getByLabel(/Registration Number \(Teacher ID\)/i)
      .fill(`TCH-${ts}`);
    await page.getByLabel(/Password/i).fill("1234");

    await page.getByRole("button", { name: /Create User/i }).click();

    await page.waitForURL(/\/users/);
    await expect(page).toHaveURL(/\/users/);
    await page.getByLabel(/Search users/i).fill(`Instructor${ts}`);
    await expect(
      page.getByText(`Instructor${ts}`, { exact: true }),
    ).toBeVisible();
  });

  test("rejects duplicate email", async ({ page }) => {
    // Seed already has this instructor email; creating it again should fail
    await page.goto("/users/add");
    await page.getByLabel(/First Name \/ Name/i).fill("Dup");
    await page.getByLabel(/Email/i).fill("e2e.teacher1@test.com");
    await page.getByLabel(/Role/i).selectOption("INSTRUCTOR");
    await page.getByLabel(/Password/i).fill("1234");
    await page.getByRole("button", { name: /Create User/i }).click();
    await expect(page.getByText(/already exists/i)).toBeVisible();
  });

  test("rejects short password", async ({ page }) => {
    await page.goto("/users/add");
    await page.getByLabel(/First Name \/ Name/i).fill("ShortPass");
    await page.getByLabel(/Email/i).fill(`short${Date.now()}@test.com`);
    await page.getByLabel(/Password/i).fill("123");
    await page.getByRole("button", { name: /Create User/i }).click();
    await expect(
      page.getByText(/Password must be at least 4 characters/i),
    ).toBeVisible();
  });
});
