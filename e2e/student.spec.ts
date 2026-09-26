import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test.describe("Student module", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("creates a new student", async ({ page }) => {
    const uniqueFirstname = `Jane${Date.now()}`;
    await page.goto("/student");
    await expect(
      page.getByRole("heading", { name: /Gestion des élèves/i }),
    ).toBeVisible();

    await page.getByRole("button", { name: /Nouvel élève/i }).click();
    const dialog = page.getByRole("dialog", { name: /Nouvel élève/i });
    await expect(dialog).toBeVisible();

    await dialog
      .getByLabel(/Registration Number/i)
      .fill(`E2E-STU-${Date.now()}`);
    await dialog.getByLabel("Lastname").fill("DoeE2E");
    await dialog.getByLabel("Firstname").fill(uniqueFirstname);
    await dialog.getByLabel(/Gender/i).selectOption("FEMALE");
    await dialog.getByLabel(/Birth Date/i).fill("2010-05-15");
    await dialog
      .getByLabel(/Class/i)
      .selectOption({ label: "E2E Class (E2E)" });
    await dialog.getByLabel(/Parent Phone/i).fill("+237600000000");

    await dialog.getByRole("button", { name: /Create student/i }).click();

    await expect(page.getByText(/Élève créé avec succès/i)).toBeVisible();
    await expect(
      page.getByRole("cell", { name: uniqueFirstname, exact: true }),
    ).toBeVisible();
  });

  test("shows validation errors when required fields missing", async ({
    page,
  }) => {
    await page.goto("/student");
    await page.getByRole("button", { name: /Nouvel élève/i }).click();
    const dialog = page.getByRole("dialog", { name: /Nouvel élève/i });
    await dialog.getByRole("button", { name: /Create student/i }).click();
    await expect(dialog.getByText(/Lastname is required/i)).toBeVisible();
    await expect(dialog.getByText(/Firstname is required/i)).toBeVisible();
    await expect(dialog.getByText(/Class is required/i)).toBeVisible();
  });

  test("searches, paginates and changes page size", async ({ page }) => {
    await page.goto("/student");
    await expect(
      page.getByText(/Affichage de 1 à \d+ sur \d+ élèves/),
    ).toBeVisible();

    const search = page.getByLabel(/Rechercher un élève/i);
    await search.fill("DoeE2E");
    await expect(
      page.getByRole("cell", { name: /DoeE2E/ }).first(),
    ).toBeVisible();

    await page.getByLabel(/Éléments par page/i).selectOption("25");
    await expect(page.getByLabel(/Éléments par page/i)).toHaveValue("25");
  });
});
