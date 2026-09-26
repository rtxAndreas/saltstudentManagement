import { type APIRequestContext, expect, test } from "@playwright/test";
import { TEST_CREDENTIALS } from "./helpers";

/**
 * Timetable business rules (EDT-001…008) and parent access control.
 * The rules must be enforced SERVER-SIDE, so these tests call the API.
 */

test.describe.configure({ mode: "serial" });

let admin: APIRequestContext;
let student: APIRequestContext;
let parent: APIRequestContext;

let schoolYearId: number;
let classroomId: number;
let smallRoomId: number;
let assignmentA: number; // teacher1 / class1 (seeded)
let assignmentB: number; // teacher2 / class1 — same class, different teacher
let assignmentC: number; // teacher2 / other class — different class and teacher
let baseSlotId: number;
// Base window chosen at runtime on a quiet part of the day, plus helpers
let baseStart = "06:05"; // overwritten by setup once a free window is found
const toMin = (hhmm: string) =>
  Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
const fmt = (total: number) =>
  `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;

test.beforeAll(async ({ browser }) => {
  const login = async (email: string, password: string, urlPattern: RegExp) => {
    const context = await browser.newContext({
      baseURL: "http://localhost:3000",
    });
    const page = await context.newPage();
    await page.goto("/login");
    await page.getByLabel(/Email Address/i).fill(email);
    await page.getByLabel(/Password/i).fill(password);
    await page.getByRole("button", { name: /Log In/i }).click();
    await page.waitForURL(urlPattern);
    return page.request;
  };

  admin = await login(
    TEST_CREDENTIALS.admin.email,
    TEST_CREDENTIALS.admin.password,
    /dashboard/,
  );
  student = await login(
    TEST_CREDENTIALS.student.email,
    TEST_CREDENTIALS.student.password,
    /portal/,
  );
  parent = await login(
    TEST_CREDENTIALS.parent.email,
    TEST_CREDENTIALS.parent.password,
    /portal/,
  );

  // Fixture data: active year, rooms, three distinct assignments
  const years = await (await admin.get("/api/schoolYear")).json();
  schoolYearId = years.find(
    (year: { status: string }) => year.status === "ACTIVE",
  ).schoolYearId;

  const room = await admin.post("/api/classroom", {
    data: { name: `E2E-Room-${Date.now()}`, capacity: 100 },
  });
  classroomId = (await room.json()).classroomId;
  const smallRoom = await admin.post("/api/classroom", {
    data: { name: `E2E-Small-${Date.now()}`, capacity: 1 },
  });
  smallRoomId = (await smallRoom.json()).classroomId;

  const assignments = await (await admin.get("/api/assignment")).json();
  const seeded = assignments.find(
    (item: { schoolYearId: number }) => item.schoolYearId === schoolYearId,
  );
  assignmentA = seeded.assignmentId;
  const classAId = seeded.classId;

  const users = await (await admin.get("/api/user")).json();
  const teachers = users.filter(
    (item: { role: string }) => item.role === "INSTRUCTOR",
  );
  const teacherB = teachers.find(
    (item: { userId: number }) => item.userId !== seeded.teacherId,
  );

  const createAssignment = async (
    teacherId: number,
    classId: number,
  ): Promise<number> => {
    const response = await admin.post("/api/assignment", {
      data: { teacherId, classId, courseId: seeded.courseId, schoolYearId },
    });
    if (response.status() === 201) {
      const created = (await response.json()).assignment?.assignmentId;
      if (created != null) return created;
    }
    // Already exists from a previous run: look it up
    const list = await (await admin.get("/api/assignment")).json();
    const existing = list.find(
      (item: { teacherId: number; classId: number }) =>
        item.teacherId === teacherId && item.classId === classId,
    );
    if (!existing) {
      throw new Error(
        `Unable to create or find the assignment for class ${classId}`,
      );
    }
    return existing.assignmentId;
  };
  assignmentB = await createAssignment(teacherB.userId, classAId);
  const otherClass = (await (await admin.get("/api/class")).json()).find(
    (item: { classId: number; status: string }) =>
      item.classId !== classAId && item.status === "ACTIVE",
  );
  if (!otherClass) throw new Error("No second active class available");
  assignmentC = await createAssignment(teacherB.userId, otherClass.classId);

  // Clean slate: remove leftover slots from previous runs on the fixture assignments
  for (const assignmentId of [assignmentA, assignmentB, assignmentC]) {
    const slots = await (
      await admin.get(
        `/api/schedule?assignmentId=${assignmentId}&schoolYearId=${schoolYearId}`,
      )
    ).json();
    for (const slot of slots as Array<{ scheduleId: number }>) {
      await admin.delete(`/api/schedule/${slot.scheduleId}`);
    }
  }
});

const createSlot = (data: Record<string, unknown>) =>
  admin.post("/api/schedule", { data: { schoolYearId, classroomId, ...data } });

test("setup: finds a free Monday window and creates the base slot", async () => {
  const candidates = [
    "06:05",
    "06:25",
    "07:05",
    "07:25",
    "12:05",
    "12:25",
    "13:05",
    "13:25",
    "15:05",
    "15:25",
  ];
  for (const start of candidates) {
    const end = fmt(toMin(start) + 40);
    const response = await createSlot({
      assignmentId: assignmentA,
      dayOfWeek: "MONDAY",
      startTime: start,
      endTime: end,
    });
    if (response.status() === 201) {
      baseStart = start;
      const slots = await (
        await admin.get(
          `/api/schedule?assignmentId=${assignmentA}&schoolYearId=${schoolYearId}`,
        )
      ).json();
      baseSlotId = slots.find(
        (slot: { dayOfWeek: string; startTime: string }) =>
          slot.dayOfWeek === "MONDAY" && slot.startTime === start,
      ).scheduleId;
      return;
    }
    expect(response.status()).toBe(409);
  }
  throw new Error("No free Monday window found among candidates");
});

test("EDT-001 same teacher same time is rejected", async () => {
  const response = await createSlot({
    assignmentId: assignmentA,
    dayOfWeek: "MONDAY",
    startTime: baseStart,
    endTime: fmt(toMin(baseStart) + 40),
  });
  expect(response.status()).toBe(409);
  expect((await response.json()).error).toMatch(/Conflit d'emploi du temps/);
});

test("EDT-001 same teacher partial overlap is rejected", async () => {
  const response = await createSlot({
    assignmentId: assignmentA,
    dayOfWeek: "MONDAY",
    startTime: fmt(toMin(baseStart) + 15),
    endTime: fmt(toMin(baseStart) + 55),
  });
  expect(response.status()).toBe(409);
  expect((await response.json()).error).toMatch(/Conflit d'emploi du temps/);
});

test("EDT-002 same class overlapping with another teacher is rejected", async () => {
  const response = await createSlot({
    assignmentId: assignmentB,
    dayOfWeek: "MONDAY",
    startTime: fmt(toMin(baseStart) + 15),
    endTime: fmt(toMin(baseStart) + 55),
  });
  expect(response.status()).toBe(409);
  expect((await response.json()).error).toMatch(
    /cette classe possède déjà un cours/,
  );
});

test("EDT-003 same room overlapping is rejected", async () => {
  const response = await createSlot({
    assignmentId: assignmentC,
    dayOfWeek: "MONDAY",
    startTime: fmt(toMin(baseStart) + 15),
    endTime: fmt(toMin(baseStart) + 55),
  });
  expect(response.status()).toBe(409);
  expect((await response.json()).error).toMatch(/Conflit de salle/);
});

test("EDT adjacency: consecutive slots are allowed", async () => {
  const first = await createSlot({
    assignmentId: assignmentA,
    dayOfWeek: "THURSDAY",
    startTime: baseStart,
    endTime: fmt(toMin(baseStart) + 40),
  });
  expect(first.status()).toBe(201);
  const second = await createSlot({
    assignmentId: assignmentC,
    dayOfWeek: "THURSDAY",
    startTime: fmt(toMin(baseStart) + 40),
    endTime: fmt(toMin(baseStart) + 80),
  });
  expect(second.status()).toBe(201);
});

test("EDT-005 insufficient room capacity is rejected", async () => {
  const response = await admin.post("/api/schedule", {
    data: {
      schoolYearId,
      classroomId: smallRoomId,
      assignmentId: assignmentA,
      dayOfWeek: "FRIDAY",
      startTime: "08:00",
      endTime: "09:00",
    },
  });
  expect(response.status()).toBe(409);
  expect((await response.json()).error).toMatch(
    /capacité de cette salle est insuffisante/,
  );
});

test("EDT-004 unassigned teacher is rejected", async () => {
  const response = await createSlot({
    assignmentId: 999999,
    dayOfWeek: "MONDAY",
    startTime: "14:00",
    endTime: "15:00",
  });
  expect(response.status()).toBe(409);
  expect((await response.json()).error).toMatch(
    /n'est pas affecté à cette matière/,
  );
});

test("EDT-007 end time must be after start time", async () => {
  const response = await createSlot({
    assignmentId: assignmentA,
    dayOfWeek: "MONDAY",
    startTime: "10:00",
    endTime: "08:00",
  });
  expect(response.status()).toBe(409);
  expect((await response.json()).error).toMatch(
    /postérieure à l'heure de début/,
  );
});

test("EDT modification does not conflict with itself", async () => {
  const response = await admin.put("/api/schedule", {
    data: {
      id: baseSlotId,
      assignmentId: assignmentA,
      dayOfWeek: "MONDAY",
      startTime: "08:00",
      endTime: "09:00",
      classroomId,
      schoolYearId,
    },
  });
  expect(response.ok()).toBeTruthy();
  expect((await response.json()).message).toMatch(/Créneau modifié/);
});

test("a student cannot create a slot", async () => {
  const response = await student.post("/api/schedule", {
    data: {
      schoolYearId,
      classroomId,
      assignmentId: assignmentA,
      dayOfWeek: "MONDAY",
      startTime: "16:00",
      endTime: "17:00",
    },
  });
  expect(response.status()).toBe(403);
});

test("a parent cannot access an unlinked child", async () => {
  const students = (await (await admin.get("/api/student")).json()) as Array<{
    studentId: number;
  }>;
  const portal = await (await parent.get("/api/portal")).json();
  const linkedIds = portal.children.map(
    (child: { student: { studentId: number } }) => child.student.studentId,
  );
  expect(linkedIds.length).toBeGreaterThan(0);
  const unlinked =
    students.find((item) => !linkedIds.includes(item.studentId)) ?? null;
  if (!unlinked) {
    test.skip();
    return;
  }

  const refused = await parent.get(
    `/api/portal?studentId=${unlinked.studentId}`,
  );
  expect(refused.status()).toBe(403);
});
