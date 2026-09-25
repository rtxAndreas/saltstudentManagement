import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const databaseUrl = process.env.DATABASE_URL || "file:./dev.db";
const dbPath = databaseUrl.startsWith("file:")
  ? databaseUrl.substring(5)
  : databaseUrl;
const adapter = new PrismaBetterSqlite3({ url: dbPath });

const prisma = new PrismaClient({ adapter });

export interface SeedResult {
  admin: { email: string; password: string };
  instructors: { email: string; password: string; userId: number }[];
  supervisors: { email: string; password: string; userId: number }[];
  students: { email: string; password: string; studentId: number }[];
  parent: { email: string; password: string };
  schoolYearId: number;
  classId: number;
  courseId: number;
  periodId: number;
  studentId: number;
  scheduleId: number;
}

const TEST_PASSWORD = "1234";

export async function seedDatabase(): Promise<SeedResult> {
  const adminEmail = "e2e.admin@test.com";
  const adminPassword = "admin1234";

  const upsertUser = async (
    email: string,
    role: "ADMIN" | "INSTRUCTOR",
    name: string,
    lastname: string,
  ) => {
    const hashed = await bcrypt.hash(TEST_PASSWORD, 10);
    return prisma.user.upsert({
      where: { email },
      create: {
        name,
        lastname,
        contact: "0000000000",
        email,
        role,
        password: hashed,
        status: "ACTIVE",
      },
      update: {
        name,
        lastname,
        contact: "0000000000",
        role,
        password: hashed,
        status: "ACTIVE",
      },
    });
  };

  const hashedAdmin = await bcrypt.hash(adminPassword, 10);
  await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      name: "E2EAdmin",
      lastname: "Test",
      contact: "0000000000",
      email: adminEmail,
      role: "ADMIN",
      password: hashedAdmin,
      status: "ACTIVE",
    },
    update: {
      name: "E2EAdmin",
      lastname: "Test",
      contact: "0000000000",
      role: "ADMIN",
      password: hashedAdmin,
      status: "ACTIVE",
    },
  });

  const instructor1 = await upsertUser(
    "e2e.teacher1@test.com",
    "INSTRUCTOR",
    "Teacher1",
    "One",
  );
  const instructor2 = await upsertUser(
    "e2e.teacher2@test.com",
    "INSTRUCTOR",
    "Teacher2",
    "Two",
  );
  const supervisor1 = await upsertUser(
    "e2e.supervisor1@test.com",
    "INSTRUCTOR",
    "Supervisor1",
    "One",
  );
  const supervisor2 = await upsertUser(
    "e2e.supervisor2@test.com",
    "INSTRUCTOR",
    "Supervisor2",
    "Two",
  );

  await prisma.schoolYear.updateMany({
    data: { status: "INACTIVE" },
  });

  const schoolYear = await prisma.schoolYear.upsert({
    where: { schoolYearId: 1 },
    create: {
      label: "E2E Year",
      startDate: new Date("2026-09-01"),
      endDate: new Date("2027-06-30"),
      status: "ACTIVE",
      schoolYearId: 1,
    },
    update: {
      label: "E2E Year",
      startDate: new Date("2026-09-01"),
      endDate: new Date("2027-06-30"),
      status: "ACTIVE",
    },
  });

  const cls = await prisma.class.upsert({
    where: { classId: 1 },
    create: {
      name: "E2E Class",
      level: "E2E",
      status: "ACTIVE",
      schoolYearId: schoolYear.schoolYearId,
      classId: 1,
    },
    update: {
      name: "E2E Class",
      level: "E2E",
      status: "ACTIVE",
      schoolYearId: schoolYear.schoolYearId,
    },
  });

  const course = await prisma.course.upsert({
    where: { courseId: 1 },
    create: {
      name: "E2E Course",
      code: "E2E-1",
      coefficient: 2,
      statusCourse: "ACTIVE",
      courseId: 1,
    },
    update: {
      name: "E2E Course",
      code: "E2E-1",
      coefficient: 2,
      statusCourse: "ACTIVE",
    },
  });

  const period = await prisma.period.upsert({
    where: { periodId: 1 },
    create: {
      label: "E2E Period",
      startDate: new Date("2026-09-01"),
      endDate: new Date("2026-12-20"),
      status: "DRAFT",
      schoolYearId: schoolYear.schoolYearId,
      periodId: 1,
    },
    update: {
      label: "E2E Period",
      startDate: new Date("2026-09-01"),
      endDate: new Date("2026-12-20"),
      status: "DRAFT",
      schoolYearId: schoolYear.schoolYearId,
    },
  });

  await prisma.assignment.deleteMany({
    where: {
      teacherId: instructor2.userId,
      classId: cls.classId,
      courseId: course.courseId,
      schoolYearId: schoolYear.schoolYearId,
    },
  });

  const assignment = await prisma.assignment.upsert({
    where: {
      teacherId_classId_courseId_schoolYearId: {
        teacherId: instructor1.userId,
        classId: cls.classId,
        courseId: course.courseId,
        schoolYearId: schoolYear.schoolYearId,
      },
    },
    create: {
      teacherId: instructor1.userId,
      classId: cls.classId,
      courseId: course.courseId,
      schoolYearId: schoolYear.schoolYearId,
    },
    update: {},
  });

  const schedule =
    (await prisma.schedule.findFirst({
      where: {
        assignmentId: assignment.assignmentId,
        schoolYearId: schoolYear.schoolYearId,
      },
    })) ??
    (await prisma.schedule.create({
      data: {
        dayOfWeek: "MONDAY",
        startTime: "08:00",
        endTime: "09:00",
        assignmentId: assignment.assignmentId,
        schoolYearId: schoolYear.schoolYearId,
      },
    }));

  const student = await prisma.student.upsert({
    where: { studentId: 1 },
    create: {
      studentId: 1,
      registrationNumber: "E2E-STU-001",
      lastname: "Doe",
      firstname: "Jane",
      gender: "FEMALE",
      birthDate: new Date("2010-05-15"),
      status: "ACTIVE",
      classId: cls.classId,
    },
    update: {
      registrationNumber: "E2E-STU-001",
      lastname: "Doe",
      firstname: "Jane",
      gender: "FEMALE",
      birthDate: new Date("2010-05-15"),
      status: "ACTIVE",
      classId: cls.classId,
    },
  });

  const upsertPortalUser = async (
    email: string,
    role: "STUDENT" | "PARENT",
    name: string,
    lastname: string,
  ) => {
    const hashed = await bcrypt.hash(TEST_PASSWORD, 10);
    return prisma.user.upsert({
      where: { email },
      create: {
        name,
        lastname,
        contact: "0000000000",
        email,
        role,
        password: hashed,
        status: "ACTIVE",
      },
      update: {
        name,
        lastname,
        contact: "0000000000",
        role,
        password: hashed,
        status: "ACTIVE",
      },
    });
  };

  const studentUser = await upsertPortalUser(
    "e2e.student@test.com",
    "STUDENT",
    "Jane",
    "Doe",
  );
  await prisma.student.update({
    where: { studentId: student.studentId },
    data: { userId: studentUser.userId },
  });

  const student2User = await upsertPortalUser(
    "e2e.student2@test.com",
    "STUDENT",
    "John",
    "Doe",
  );
  const student2 = await prisma.student.upsert({
    where: { studentId: 2 },
    create: {
      studentId: 2,
      registrationNumber: "E2E-STU-002",
      lastname: "Doe",
      firstname: "John",
      gender: "MALE",
      birthDate: new Date("2011-03-10"),
      status: "ACTIVE",
      classId: cls.classId,
      userId: student2User.userId,
    },
    update: {
      registrationNumber: "E2E-STU-002",
      lastname: "Doe",
      firstname: "John",
      gender: "MALE",
      birthDate: new Date("2011-03-10"),
      status: "ACTIVE",
      classId: cls.classId,
      userId: student2User.userId,
    },
  });

  const parentUser = await upsertPortalUser(
    "e2e.parent@test.com",
    "PARENT",
    "Marie",
    "Doe",
  );
  const guardian = await prisma.guardian.upsert({
    where: { userId: parentUser.userId },
    create: {
      userId: parentUser.userId,
      occupation: "Commerçante",
      address: "123 E2E Street",
    },
    update: {},
  });
  await prisma.guardianStudent.upsert({
    where: {
      guardianId_studentId: {
        guardianId: guardian.guardianId,
        studentId: student.studentId,
      },
    },
    create: {
      guardianId: guardian.guardianId,
      studentId: student.studentId,
      relationship: "GUARDIAN",
      isPrimary: true,
    },
    update: {},
  });
  await prisma.guardianStudent.upsert({
    where: {
      guardianId_studentId: {
        guardianId: guardian.guardianId,
        studentId: student2.studentId,
      },
    },
    create: {
      guardianId: guardian.guardianId,
      studentId: student2.studentId,
      relationship: "GUARDIAN",
      isPrimary: false,
    },
    update: {},
  });

  const enrollment = await prisma.enrollment.upsert({
    where: {
      studentId_schoolYearId: {
        studentId: student.studentId,
        schoolYearId: schoolYear.schoolYearId,
      },
    },
    create: {
      studentId: student.studentId,
      classId: cls.classId,
      schoolYearId: schoolYear.schoolYearId,
      status: "ACTIVE",
    },
    update: { classId: cls.classId, status: "ACTIVE" },
  });
  await prisma.enrollment.upsert({
    where: {
      studentId_schoolYearId: {
        studentId: student2.studentId,
        schoolYearId: schoolYear.schoolYearId,
      },
    },
    create: {
      studentId: student2.studentId,
      classId: cls.classId,
      schoolYearId: schoolYear.schoolYearId,
      status: "ACTIVE",
    },
    update: { classId: cls.classId, status: "ACTIVE" },
  });
  await prisma.studentInvoice.upsert({
    where: { reference: "E2E-INV-001" },
    create: {
      enrollmentId: enrollment.enrollmentId,
      reference: "E2E-INV-001",
      label: "Écolage · 1re tranche",
      totalAmount: 150000,
      paidAmount: 50000,
      dueDate: new Date("2026-10-15"),
      status: "PARTIALLY_PAID",
    },
    update: {
      totalAmount: 150000,
      paidAmount: 50000,
      status: "PARTIALLY_PAID",
    },
  });

  return {
    admin: { email: adminEmail, password: adminPassword },
    instructors: [
      {
        email: instructor1.email,
        password: TEST_PASSWORD,
        userId: instructor1.userId,
      },
      {
        email: instructor2.email,
        password: TEST_PASSWORD,
        userId: instructor2.userId,
      },
    ],
    supervisors: [
      {
        email: supervisor1.email,
        password: TEST_PASSWORD,
        userId: supervisor1.userId,
      },
      {
        email: supervisor2.email,
        password: TEST_PASSWORD,
        userId: supervisor2.userId,
      },
    ],
    students: [
      {
        email: studentUser.email,
        password: TEST_PASSWORD,
        studentId: student.studentId,
      },
      {
        email: student2User.email,
        password: TEST_PASSWORD,
        studentId: student2.studentId,
      },
    ],
    parent: { email: parentUser.email, password: TEST_PASSWORD },
    schoolYearId: schoolYear.schoolYearId,
    classId: cls.classId,
    courseId: course.courseId,
    periodId: period.periodId,
    studentId: student.studentId,
    scheduleId: schedule.scheduleId,
  };
}

// Allow running directly with ts-node/esbuild when invoked as a CLI, e.g.:
//   node --import tsx scripts/seed-e2e.ts
if (process.argv[1]?.endsWith("seed-e2e.ts")) {
  seedDatabase()
    .then((r) => {
      console.log("Seeded:", JSON.stringify(r, null, 2));
      return prisma.$disconnect();
    })
    .catch(async (e) => {
      console.error("Seed failed:", e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
