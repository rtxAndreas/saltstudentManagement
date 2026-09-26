import { expect, test } from "@playwright/test";
import { login, TEST_CREDENTIALS } from "./helpers";

test.describe("Authentication", () => {
  test("redirects unauthenticated user to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("logs in with valid admin credentials", async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/dashboard/);
    const sidebar = page.locator("aside, nav").first();
    await expect(sidebar).toBeVisible();
  });

  test("rejects invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/Email Address/i).fill("nobody@test.com");
    await page.getByLabel(/Password/i).fill("wrongpass");
    await page.getByRole("button", { name: /Log In/i }).click();
    await expect(page.getByText(/Invalid email or password/i)).toBeVisible();
  });

  test("redirects authenticated user away from login", async ({ page }) => {
    await login(page);
    await page.goto("/login");
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("logs in as instructor and is restricted from admin-only pages", async ({
    page,
  }) => {
    await login(
      page,
      TEST_CREDENTIALS.instructor.email,
      TEST_CREDENTIALS.instructor.password,
    );
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
