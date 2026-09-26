import { expect, test } from "@playwright/test";
import { login, TEST_CREDENTIALS } from "./helpers";

test.describe("Cross-record authorization", () => {
  test("an instructor cannot record attendance for another instructor's course", async ({
    page,
  }) => {
    await login(page);
    const schedulesResponse = await page.request.get("/api/schedule");
    expect(schedulesResponse.status()).toBe(200);
    const schedules = await schedulesResponse.json();
    const schedule = schedules.find(
      (item: { assignment: { teacher: { name: string } } }) =>
        item.assignment.teacher.name === "Teacher1",
    );
    expect(schedule).toBeDefined();

    const logoutResponse = await page.request.post("/api/auth/logout");
    expect(logoutResponse.status()).toBe(200);
    await page.goto("/login");
    await page.getByLabel(/Email Address/i).fill("e2e.teacher2@test.com");
    await page
      .getByLabel(/Password/i)
      .fill(TEST_CREDENTIALS.instructor.password);
    await page.getByRole("button", { name: /Log In/i }).click();
    await page.waitForURL(/\/dashboard/);

    const response = await page.request.post("/api/attendance", {
      data: {
        studentId: 1,
        scheduleId: schedule.scheduleId,
        date: "2026-09-28T00:00:00.000Z",
        status: "PRESENT",
      },
    });

    expect(response.status()).toBe(403);
  });

  test("an instructor only receives grades from their own assignments", async ({
    page,
  }) => {
    await login(
      page,
      TEST_CREDENTIALS.instructor.email,
      TEST_CREDENTIALS.instructor.password,
    );

    const [meResponse, gradesResponse] = await Promise.all([
      page.request.get("/api/user/me"),
      page.request.get("/api/grade"),
    ]);
    expect(meResponse.status()).toBe(200);
    expect(gradesResponse.status()).toBe(200);
    const me = await meResponse.json();
    const grades = await gradesResponse.json();
    expect(
      grades.every(
        (grade: { assignment: { teacherId: number } }) =>
          grade.assignment.teacherId === me.userId,
      ),
    ).toBeTruthy();
  });
});
