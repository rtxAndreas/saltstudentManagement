import { expect, type Page } from "@playwright/test";

export const TEST_CREDENTIALS = {
  admin: { email: "e2e.admin@test.com", password: "admin1234" },
  instructor: { email: "e2e.teacher1@test.com", password: "1234" },
  student: { email: "e2e.student@test.com", password: "1234" },
  parent: { email: "e2e.parent@test.com", password: "1234" },
};

export async function login(page: Page, email?: string, password?: string) {
  const creds = {
    email: email || TEST_CREDENTIALS.admin.email,
    password: password || TEST_CREDENTIALS.admin.password,
  };
  await page.goto("/login");
  await page.getByLabel(/Email Address/i).fill(creds.email);
  await page.getByLabel(/Password/i).fill(creds.password);
  await page.getByRole("button", { name: /Log In/i }).click();
  // Admins land on /dashboard, students and parents on /portal, accountants on /finance
  await page.waitForURL(/\/(dashboard|portal|finance)/);
}

// Cleanup helper to catch dashboard fully loaded
export async function expectOnDashboard(page: Page) {
  await expect(page).toHaveURL(/\/dashboard/);
}
