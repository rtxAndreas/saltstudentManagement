import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUserFromRequest } from "@/lib/auth";
import { verifyUserAccess } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

const gradeSchema = z
  .object({
    value: z.number().min(0, "Value must be positive"),
    maxScore: z.number().min(1, "Max score must be at least 1").default(20),
    comment: z.string().optional(),
    studentId: z.number().int().positive("Student is required"),
    periodId: z.number().int().positive("Period is required"),
    assignmentId: z.number().int().positive("Assignment is required"),
    assessmentId: z.number().int().positive().optional(),
  })
  .refine((data) => data.value <= data.maxScore, {
    message: "Value cannot exceed max score",
    path: ["value"],
  });

const gradeUpdateSchema = z
  .object({
    id: z.number().int().positive(),
    value: z.number().min(0),
    maxScore: z.number().min(1).optional(),
    comment: z.string().optional(),
  })
  .refine(
    (data) => data.maxScore === undefined || data.value <= data.maxScore,
    {
      message: "Value cannot exceed max score",
      path: ["value"],
    },
  );

export async function GET(req: NextRequest) {
  try {
    const accessError = await verifyUserAccess(req);
    if (accessError) return accessError;

    const { searchParams } = new URL(req.url);
    const assignmentId = searchParams.get("assignmentId");
    const studentId = searchParams.get("studentId");

    const where: Record<string, unknown> = {};
    if (assignmentId) where.assignmentId = Number(assignmentId);
    if (studentId) where.studentId = Number(studentId);
    const user = await getUserFromRequest(req);
    if (user?.role === "INSTRUCTOR") {
      where.assignment = { teacherId: user.userId };
    }

    const grades = await prisma.grade.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        student: true,
        period: true,
        assignment: true,
        createdBy: { select: { userId: true, name: true, lastname: true } },
      },
    });

    return NextResponse.json(grades);
  } catch (error) {
    console.error("GET /api/grade error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const accessError = await verifyUserAccess(req);
    if (accessError) return accessError;
    const user = await getUserFromRequest(req);
    if (!user)
      return NextResponse.json({ error: "Access denied" }, { status: 403 });

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = gradeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const {
      value,
      maxScore,
      comment,
      studentId,
      periodId,
      assignmentId,
      assessmentId,
    } = parsed.data;

    const [student, period, assignment, assessment] = await Promise.all([
      prisma.student.findUnique({
        where: { studentId },
        include: { guardians: { include: { guardian: true } } },
      }),
      prisma.period.findUnique({ where: { periodId } }),
      prisma.assignment.findUnique({
        where: { assignmentId },
        include: { class: true, course: true },
      }),
      assessmentId
        ? prisma.assessment.findUnique({ where: { assessmentId } })
        : null,
    ]);

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }
    if (!period) {
      return NextResponse.json({ error: "Period not found" }, { status: 404 });
    }
    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 },
      );
    }
    if (student.classId !== assignment.classId) {
      return NextResponse.json(
        { error: "Student does not belong to the assignment class" },
        { status: 400 },
      );
    }
    if (
      period.schoolYearId !== assignment.schoolYearId ||
      assignment.class.schoolYearId !== assignment.schoolYearId
    ) {
      return NextResponse.json(
        {
          error:
            "Student, assignment and period must belong to the same school year",
        },
        { status: 400 },
      );
    }
    if (user.role === "INSTRUCTOR" && assignment.teacherId !== user.userId) {
      return NextResponse.json(
        { error: "You can only grade your own assigned classes" },
        { status: 403 },
      );
    }
    if (
      assessment &&
      (assessment.assignmentId !== assignmentId ||
        assessment.periodId !== periodId ||
        assessment.maxScore !== maxScore)
    ) {
      return NextResponse.json(
        {
          error:
            "Assessment, assignment, period and maximum score do not match",
        },
        { status: 400 },
      );
    }

    const grade = await prisma.grade.create({
      data: {
        value,
        maxScore,
        comment: comment || null,
        studentId,
        periodId,
        assignmentId,
        createdById: user.userId,
        assessmentId: assessmentId || null,
      },
      include: {
        student: true,
        period: true,
        assignment: true,
        createdBy: { select: { userId: true, name: true, lastname: true } },
      },
    });

    if (assessment?.publishedAt) {
      const recipientIds = new Set<number>();
      if (student.userId) recipientIds.add(student.userId);
      for (const link of student.guardians)
        recipientIds.add(link.guardian.userId);
      if (recipientIds.size) {
        await prisma.notification.create({
          data: {
            title: `Nouvelle note — ${assignment.course.name}`,
            message: `${student.firstname} ${student.lastname} a obtenu ${value}/${maxScore}${comment ? ` — ${comment}` : ""}.`,
            type: "GRADE_PUBLISHED",
            audience: "USER",
            createdById: user.userId,
            recipients: {
              create: [...recipientIds].map((userId) => ({ userId })),
            },
          },
        });
      }
    }

    return NextResponse.json(
      { message: "Grade created successfully", grade },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/grade error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const accessError = await verifyUserAccess(req);
    if (accessError) return accessError;
    const user = await getUserFromRequest(req);
    if (!user)
      return NextResponse.json({ error: "Access denied" }, { status: 403 });

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = gradeUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { id, value, maxScore, comment } = parsed.data;

    const existingGrade = await prisma.grade.findUnique({
      where: { gradeId: id },
      include: { assignment: true },
    });
    if (!existingGrade) {
      return NextResponse.json({ error: "Grade not found" }, { status: 404 });
    }
    if (
      user.role === "INSTRUCTOR" &&
      existingGrade.assignment.teacherId !== user.userId
    ) {
      return NextResponse.json(
        { error: "You can only update grades from your own assignments" },
        { status: 403 },
      );
    }

    const effectiveMaxScore = maxScore ?? existingGrade.maxScore;
    if (value > effectiveMaxScore) {
      return NextResponse.json(
        { error: "Value cannot exceed max score" },
        { status: 400 },
      );
    }

    const updatedGrade = await prisma.grade.update({
      where: { gradeId: id },
      data: {
        value,
        ...(maxScore !== undefined && { maxScore }),
        ...(comment !== undefined && { comment }),
      },
    });

    return NextResponse.json({
      message: "Grade updated successfully",
      grade: updatedGrade,
    });
  } catch (error) {
    console.error("PATCH /api/grade error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
