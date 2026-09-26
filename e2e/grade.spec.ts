import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test.describe("Grade module", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("creates a new grade", async ({ page }) => {
    await page.goto("/grade");
    await expect(
      page.getByRole("heading", { name: /Grade management/i }),
    ).toBeVisible();

    await page.getByLabel(/Student/i).selectOption({ label: "Jane Doe" });
    await page
      .getByLabel(/Assignment/i)
      .selectOption({ label: "E2E Course - E2E Class" });
    await page.getByLabel(/Period/i).selectOption({ label: "E2E Period" });
    await page.getByLabel("Value").fill("15");
    await page.getByLabel("Max Score").fill("20");

    await page.getByRole("button", { name: /Create grade/i }).click();

    await expect(page.getByText(/Grade created successfully/i)).toBeVisible();
  });

  test("rejects value exceeding max score", async ({ page }) => {
    await page.goto("/grade");
    await page.getByLabel(/Student/i).selectOption({ label: "Jane Doe" });
    await page
      .getByLabel(/Assignment/i)
      .selectOption({ label: "E2E Course - E2E Class" });
    await page.getByLabel(/Period/i).selectOption({ label: "E2E Period" });
    await page.getByLabel("Value").fill("25");
    await page.getByLabel("Max Score").fill("20");
    await page.getByRole("button", { name: /Create grade/i }).click();
    await expect(
      page.getByText(/Value cannot exceed max score/i),
    ).toBeVisible();
  });
});
