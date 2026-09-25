import { prisma } from "@/lib/prisma";

export interface CourseResult {
  courseId: number;
  course: string;
  average: number;
  gradedCount: number;
}

export interface StudentClassResult {
  enrollmentId: number;
  studentId: number;
  firstname: string;
  lastname: string;
  registrationNumber: string | null;
  courseResults: CourseResult[];
  generalAverage: number | null;
  rank: number | null;
  classSize: number;
}

export interface ClassResults {
  className: string;
  periodLabel: string;
  schoolYearLabel: string;
  courses: Array<{ courseId: number; course: string }>;
  rows: StudentClassResult[];
  classAverage: number | null;
}

const round2 = (value: number) => Math.round(value * 100) / 100;

/**
 * Compute per-course averages, general average and ranks for every active
 * student of a class during a period. Averages are normalized on 20 and
 * weighted by the assessment (or course) coefficient, like the portal.
 */
export async function computeClassResults(
  classId: number,
  periodId: number,
): Promise<ClassResults | null> {
  const period = await prisma.period.findUnique({
    where: { periodId },
    include: { schoolYear: true },
  });
  if (!period) return null;

  const [classRecord, enrollments, grades] = await Promise.all([
    prisma.class.findUnique({ where: { classId } }),
    prisma.enrollment.findMany({
      where: { classId, schoolYearId: period.schoolYearId, status: "ACTIVE" },
      include: { student: true },
      orderBy: [
        { student: { lastname: "asc" } },
        { student: { firstname: "asc" } },
      ],
    }),
    prisma.grade.findMany({
      where: { periodId, assignment: { classId } },
      include: {
        assessment: { select: { coefficient: true } },
        assignment: {
          include: {
            course: {
              select: { courseId: true, name: true, coefficient: true },
            },
          },
        },
      },
    }),
  ]);
  if (!classRecord) return null;

  const courses = [
    ...new Map(
      grades.map((grade) => [
        grade.assignment.course.courseId,
        grade.assignment.course,
      ]),
    ).values(),
  ]
    .map((course) => ({ courseId: course.courseId, course: course.name }))
    .sort((a, b) => a.course.localeCompare(b.course));

  const byStudent = new Map<
    number,
    Map<number, { total: number; weight: number; count: number }>
  >();
  for (const grade of grades) {
    const coefficient =
      grade.assessment?.coefficient ?? grade.assignment.course.coefficient;
    const student = byStudent.get(grade.studentId) ?? new Map();
    const current = student.get(grade.assignment.courseId) ?? {
      total: 0,
      weight: 0,
      count: 0,
    };
    current.total += (grade.value / grade.maxScore) * 20 * coefficient;
    current.weight += coefficient;
    current.count += 1;
    student.set(grade.assignment.courseId, current);
    byStudent.set(grade.studentId, student);
  }

  const gradedStudents = enrollments.filter((enrollment) =>
    byStudent.has(enrollment.studentId),
  );
  const generalAverages = new Map<number, number>();
  for (const enrollment of gradedStudents) {
    const courseMap = byStudent.get(enrollment.studentId)!;
    const courseAverages = [...courseMap.values()].map((item) =>
      item.weight ? item.total / item.weight : 0,
    );
    const general = courseAverages.length
      ? round2(
          courseAverages.reduce((sum, average) => sum + average, 0) /
            courseAverages.length,
        )
      : null;
    if (general != null) generalAverages.set(enrollment.studentId, general);
  }

  const ranked = [...generalAverages.entries()].sort((a, b) => b[1] - a[1]);
  const ranks = new Map<number, number>();
  let currentRank = 0;
  let currentAverage: number | null = null;
  for (const [studentId, average] of ranked) {
    if (average !== currentAverage) {
      currentRank = ranks.size + 1;
      currentAverage = average;
    }
    ranks.set(studentId, currentRank);
  }

  const rows: StudentClassResult[] = enrollments.map((enrollment) => {
    const courseMap = byStudent.get(enrollment.studentId);
    const courseResults: CourseResult[] = courses.map((course) => {
      const entry = courseMap?.get(course.courseId);
      return {
        courseId: course.courseId,
        course: course.course,
        average: entry && entry.weight ? round2(entry.total / entry.weight) : 0,
        gradedCount: entry?.count ?? 0,
      };
    });
    return {
      enrollmentId: enrollment.enrollmentId,
      studentId: enrollment.studentId,
      firstname: enrollment.student.firstname,
      lastname: enrollment.student.lastname,
      registrationNumber: enrollment.student.registrationNumber,
      courseResults,
      generalAverage: generalAverages.get(enrollment.studentId) ?? null,
      rank: ranks.get(enrollment.studentId) ?? null,
      classSize: gradedStudents.length,
    };
  });

  const averages = [...generalAverages.values()];
  return {
    className: classRecord.name,
    periodLabel: period.label,
    schoolYearLabel: period.schoolYear.label,
    courses,
    rows,
    classAverage: averages.length
      ? round2(
          averages.reduce((sum, average) => sum + average, 0) / averages.length,
        )
      : null,
  };
}

/**
 * Persist or refresh the report cards of a class for a period. Returns the
 * number of saved cards. Validation stamps the cards and is handled by the
 * API layer so notifications stay outside the pure computation.
 */
export async function saveClassReportCards(
  classId: number,
  periodId: number,
  validatedById?: number,
) {
  const results = await computeClassResults(classId, periodId);
  if (!results) return null;

  let saved = 0;
  for (const row of results.rows) {
    if (row.generalAverage == null) continue;
    const data = {
      generalAverage: row.generalAverage,
      rank: row.rank ?? 0,
      classSize: row.classSize,
      ...(validatedById
        ? {
            status: "VALIDATED" as const,
            validatedById,
            validatedAt: new Date(),
          }
        : {}),
    };
    await prisma.reportCard.upsert({
      where: {
        enrollmentId_periodId: { enrollmentId: row.enrollmentId, periodId },
      },
      create: { enrollmentId: row.enrollmentId, periodId, ...data },
      update: data,
    });
    saved += 1;
  }
  return { results, saved };
}
