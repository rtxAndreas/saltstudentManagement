import { expect, test } from "@playwright/test";
import { login, TEST_CREDENTIALS } from "./helpers";

test.describe("API permissions", () => {
  test("rejects unauthenticated access to protected user API", async ({
    request,
  }) => {
    const response = await request.get("/api/user");

    expect(response.status()).toBe(403);
  });

  test("allows an instructor to read courses but not create one", async ({
    page,
  }) => {
    await login(
      page,
      TEST_CREDENTIALS.instructor.email,
      TEST_CREDENTIALS.instructor.password,
    );

    const coursesResponse = await page.request.get("/api/course");
    expect(coursesResponse.status()).toBe(200);

    const createResponse = await page.request.post("/api/course", {
      data: {
        name: "Unauthorized Course",
        code: `UNAUTHORIZED-${Date.now()}`,
        coefficient: 1,
      },
    });
    expect(createResponse.status()).toBe(403);
  });

  test("allows an admin to access users API and rejects invalid payloads", async ({
    page,
  }) => {
    await login(page);

    const usersResponse = await page.request.get("/api/user");
    expect(usersResponse.status()).toBe(200);

    const invalidResponse = await page.request.post("/api/user", {
      data: { email: "invalid" },
    });
    expect(invalidResponse.status()).toBe(400);
  });

  test("protects finance writes and event publishing from instructors", async ({
    page,
  }) => {
    await login(
      page,
      TEST_CREDENTIALS.instructor.email,
      TEST_CREDENTIALS.instructor.password,
    );

    const paymentsResponse = await page.request.get("/api/payments");
    expect(paymentsResponse.status()).toBe(403);

    const paymentWriteResponse = await page.request.post("/api/payments", {
      data: {},
    });
    expect(paymentWriteResponse.status()).toBe(403);

    const eventWriteResponse = await page.request.post("/api/events", {
      data: {},
    });
    expect(eventWriteResponse.status()).toBe(403);
  });
});
