import { Status } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyUserAccess } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

const querySchema = z.object({
  periodId: z.string().min(1, "periodId is required"),
});

interface StudentGrade {
  gradeId: number;
  value: number;
  maxScore: number;
  comment: string | null;
  assignment: {
    assignmentId: number;
    course: {
      courseId: number;
      name: string;
      code: string;
      coefficient: number;
    };
  };
}

interface StudentReport {
  studentId: number;
  firstname: string;
  lastname: string;
  registrationNumber: string | null;
  grades: StudentGrade[];
  average: number;
  rank: number;
}

interface ClassReport {
  classId: number;
  className: string;
  classLevel: string;
  periodId: number;
  periodLabel: string;
  students: StudentReport[];
  statistics: {
    classAverage: number;
    highestAverage: number;
    lowestAverage: number;
    totalStudents: number;
    studentsWithGrades: number;
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const accessError = await verifyUserAccess(req);
    if (accessError) return accessError;

    const { id } = await params;
    const classId = Number(id);

    if (Number.isNaN(classId)) {
      return NextResponse.json({ error: "Invalid class ID" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const parsed = querySchema.safeParse({
      periodId: searchParams.get("periodId"),
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const periodId = Number(parsed.data.periodId);

    if (Number.isNaN(periodId)) {
      return NextResponse.json({ error: "Invalid period ID" }, { status: 400 });
    }

    const classItem = await prisma.class.findUnique({
      where: { classId },
    });

    if (!classItem) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    const period = await prisma.period.findUnique({
      where: { periodId },
    });

    if (!period) {
      return NextResponse.json({ error: "Period not found" }, { status: 404 });
    }

    const students = await prisma.student.findMany({
      where: {
        classId,
        status: Status.ACTIVE,
      },
      include: {
        grades: {
          where: { periodId },
          include: {
            assignment: {
              include: {
                course: {
                  select: {
                    courseId: true,
                    name: true,
                    code: true,
                    coefficient: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { lastname: "asc" },
    });

    const studentsWithAverage: StudentReport[] = students.map((student) => {
      const grades = student.grades as unknown as StudentGrade[];

      let totalWeighted = 0;
      let totalCoefficients = 0;

      for (const grade of grades) {
        const normalized = (grade.value / grade.maxScore) * 20;
        const coefficient = grade.assignment.course.coefficient;
        totalWeighted += normalized * coefficient;
        totalCoefficients += coefficient;
      }

      const average =
        totalCoefficients > 0
          ? Math.round((totalWeighted / totalCoefficients) * 100) / 100
          : 0;

      return {
        studentId: student.studentId,
        firstname: student.firstname,
        lastname: student.lastname,
        registrationNumber: student.registrationNumber,
        grades,
        average,
        rank: 0,
      };
    });

    const sorted = [...studentsWithAverage].sort(
      (a, b) => b.average - a.average,
    );

    let currentRank = 1;
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i].average < sorted[i - 1].average) {
        currentRank = i + 1;
      }
      sorted[i].rank = currentRank;
    }

    const ranks = new Map<number, number>(
      sorted.map((r) => [r.studentId, r.rank]),
    );
    const ranked: StudentReport[] = studentsWithAverage.map((s) => ({
      ...s,
      rank: ranks.get(s.studentId) ?? 0,
    }));

    const studentsWithGradesCount = studentsWithAverage.filter(
      (s) => s.grades.length > 0,
    ).length;

    const averages = studentsWithAverage
      .filter((s) => s.grades.length > 0)
      .map((s) => s.average);

    const statistics = {
      classAverage:
        averages.length > 0
          ? Math.round(
              (averages.reduce((a, b) => a + b, 0) / averages.length) * 100,
            ) / 100
          : 0,
      highestAverage: averages.length > 0 ? Math.max(...averages) : 0,
      lowestAverage: averages.length > 0 ? Math.min(...averages) : 0,
      totalStudents: studentsWithAverage.length,
      studentsWithGrades: studentsWithGradesCount,
    };

    const report: ClassReport = {
      classId: classItem.classId,
      className: classItem.name,
      classLevel: classItem.level,
      periodId: period.periodId,
      periodLabel: period.label,
      students: ranked,
      statistics,
    };

    return NextResponse.json(report);
  } catch (error) {
    console.error("GET /api/class/[id]/report error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
