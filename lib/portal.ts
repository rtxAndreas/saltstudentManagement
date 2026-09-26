import { prisma } from "@/lib/prisma";

export async function getStudentPortalData(studentId: number) {
  const student = await prisma.student.findUnique({
    where: { studentId },
    include: {
      class: { include: { schoolYear: true } },
      enrollments: {
        orderBy: { enrolledAt: "desc" },
        include: {
          class: true,
          schoolYear: true,
          invoices: {
            orderBy: { dueDate: "asc" },
            include: {
              payments: {
                where: { cancelledAt: null },
                include: { receipt: true },
              },
            },
          },
        },
      },
    },
  });
  if (!student) return null;
  const activeEnrollment =
    student.enrollments.find((item) => item.status === "ACTIVE") ??
    student.enrollments[0];
  const schoolYearId =
    activeEnrollment?.schoolYearId ?? student.class.schoolYearId;
  const classId = activeEnrollment?.classId ?? student.classId;

  const [schedules, grades, examRooms, attendance, reportCards] =
    await Promise.all([
      prisma.schedule.findMany({
        where: { schoolYearId, assignment: { classId } },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
        include: {
          classroom: true,
          assignment: {
            include: {
              course: true,
              teacher: { select: { userId: true, name: true, lastname: true } },
            },
          },
        },
      }),
      prisma.grade.findMany({
        where: { studentId, period: { schoolYearId } },
        orderBy: { createdAt: "desc" },
        include: {
          period: true,
          assessment: true,
          assignment: { include: { course: true } },
        },
      }),
      prisma.examRoomAllocation.findMany({
        where: { studentId, examSession: { schoolYearId } },
        orderBy: { examSession: { startDate: "asc" } },
        include: { classroom: true, examSession: true },
      }),
      prisma.attendance.findMany({
        where: { studentId },
        orderBy: { date: "desc" },
        take: 30,
        include: {
          schedule: { include: { assignment: { include: { course: true } } } },
        },
      }),
      prisma.reportCard.findMany({
        where: { enrollment: { studentId }, status: "VALIDATED" },
        orderBy: { validatedAt: "desc" },
        include: { period: true },
      }),
    ]);

  const courseAverages = new Map<
    number,
    { courseId: number; course: string; total: number; weight: number }
  >();
  for (const grade of grades) {
    const coefficient =
      grade.assessment?.coefficient ?? grade.assignment.course.coefficient;
    const current = courseAverages.get(grade.assignment.courseId) ?? {
      courseId: grade.assignment.courseId,
      course: grade.assignment.course.name,
      total: 0,
      weight: 0,
    };
    current.total += (grade.value / grade.maxScore) * 20 * coefficient;
    current.weight += coefficient;
    courseAverages.set(grade.assignment.courseId, current);
  }
  const averages = [...courseAverages.values()].map((item) => ({
    courseId: item.courseId,
    course: item.course,
    average: item.weight
      ? Math.round((item.total / item.weight) * 100) / 100
      : 0,
  }));

  return {
    student,
    activeEnrollment,
    schedules,
    grades,
    averages,
    generalAverage: averages.length
      ? Math.round(
          (averages.reduce((sum, item) => sum + item.average, 0) /
            averages.length) *
            100,
        ) / 100
      : null,
    examRooms,
    attendance,
    reportCards,
  };
}
