import { expect, test } from "@playwright/test";
import { login, TEST_CREDENTIALS } from "./helpers";

test.describe("Role spaces", () => {
  test("parent sees the parent tree, child selector and schedule", async ({
    page,
  }) => {
    await login(
      page,
      TEST_CREDENTIALS.parent.email,
      TEST_CREDENTIALS.parent.password,
    );
    await expect(page).toHaveURL(/\/portal/);
    await expect(
      page.getByRole("heading", { name: /Suivi de Jane/i }),
    ).toBeVisible();

    // Tree navigation: parent-specific groups
    const sidebar = page.locator("aside").first();
    await expect(
      sidebar.getByRole("link", { name: /Mes enfants/i }),
    ).toBeVisible();
    await expect(
      sidebar.getByRole("button", { name: /Suivi de l.enfant/i }),
    ).toBeVisible();

    // Two linked children are selectable
    const selector = page.getByLabel(/Enfant suivi/i);
    await expect(selector).toBeVisible();
    await expect(selector).toContainText("Jane");
    await expect(selector).toContainText("John");

    // Weekly timetable through the tree
    await sidebar.getByRole("button", { name: /Suivi de l.enfant/i }).click();
    await sidebar.getByRole("link", { name: /Emploi du temps/i }).click();
    await expect(
      page.getByRole("heading", { name: /^Emploi du temps$/ }),
    ).toBeVisible();

    // School fees for the selected child
    await sidebar.getByRole("button", { name: /Administratif/i }).click();
    await sidebar.getByRole("link", { name: /^Paiements$/i }).click();
    await expect(
      page.getByRole("heading", { name: /Écolage et paiements/i }),
    ).toBeVisible();
    await expect(page.getByText(/E2E-INV-001/)).toBeVisible();
  });

  test("student sees the student tree and timetable", async ({ page }) => {
    await login(
      page,
      TEST_CREDENTIALS.student.email,
      TEST_CREDENTIALS.student.password,
    );
    await expect(page).toHaveURL(/\/portal/);
    await expect(
      page.getByRole("heading", { name: /Bonjour Jane/i }),
    ).toBeVisible();

    const sidebar = page.locator("aside").first();
    await expect(
      sidebar.getByRole("button", { name: /Vie scolaire/i }),
    ).toBeVisible();

    await sidebar.getByRole("button", { name: /Vie scolaire/i }).click();
    await sidebar.getByRole("link", { name: /Emploi du temps/i }).click();
    await expect(
      page.getByRole("heading", { name: /^Emploi du temps$/ }),
    ).toBeVisible();

    await sidebar.getByRole("link", { name: /Résultats/i }).click();
    await expect(
      page.getByRole("heading", { name: /^Résultats$/ }),
    ).toBeVisible();
  });

  test("admin sees the grouped administration tree", async ({ page }) => {
    await login(page);
    const sidebar = page.locator("aside").first();
    for (const group of [
      /Scolarité/i,
      /Pédagogie/i,
      /Examens/i,
      /Communication/i,
      /Configuration/i,
    ]) {
      await expect(sidebar.getByRole("button", { name: group })).toBeVisible();
    }

    await sidebar.getByRole("button", { name: /Pédagogie/i }).click();
    await sidebar.getByRole("link", { name: /Bulletins/i }).click();
    await expect(
      page.getByRole("heading", { name: /Bulletins et résultats/i }),
    ).toBeVisible();
  });

  test("admin opens the help guide", async ({ page }) => {
    await login(page);
    const sidebar = page.locator("aside").first();
    await sidebar.getByRole("link", { name: /Aide/i }).click();
    await expect(
      page.getByRole("heading", { name: /Guide de l.école/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Mise en route/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Créer l.année scolaire/i }),
    ).toBeVisible();
  });

  test("instructor sees the teaching tree without user management", async ({
    page,
  }) => {
    await login(
      page,
      TEST_CREDENTIALS.instructor.email,
      TEST_CREDENTIALS.instructor.password,
    );
    const sidebar = page.locator("aside").first();
    await expect(
      sidebar.getByRole("button", { name: /Enseignement/i }),
    ).toBeVisible();
    await sidebar.getByRole("button", { name: /Enseignement/i }).click();
    await expect(
      sidebar.getByRole("link", { name: /Mes affectations/i }),
    ).toBeVisible();
    await expect(
      sidebar.getByRole("link", { name: /Utilisateurs/i }),
    ).toHaveCount(0);
  });
});
