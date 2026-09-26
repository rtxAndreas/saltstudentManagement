import { Prisma } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminAccess, verifyUserAccess } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

const assignmentSchema = z.object({
  teacherId: z.number().int().positive("Teacher is required"),
  classId: z.number().int().positive("Class is required"),
  courseId: z.number().int().positive("Course is required"),
  schoolYearId: z.number().int().positive("School year is required"),
});

const assignmentUpdateSchema = z.object({
  id: z.number().int().positive(),
  classId: z.number().int().positive().optional(),
  courseId: z.number().int().positive().optional(),
  schoolYearId: z.number().int().positive().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const accessError = await verifyUserAccess(req);
    if (accessError) return accessError;

    const assignments = await prisma.assignment.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        teacher: { select: { userId: true, name: true, lastname: true } },
        class: true,
        course: true,
        schoolYear: true,
      },
    });

    return NextResponse.json(assignments);
  } catch (error) {
    console.error("GET /api/assignment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Only ADMIN can create an assignment
    const accessError = await verifyAdminAccess(req);
    if (accessError) return accessError;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = assignmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { teacherId, classId, courseId, schoolYearId } = parsed.data;

    // 2. Validate the referenced entities exist
    const [teacher, classItem, courseItem, schoolYearItem] = await Promise.all([
      prisma.user.findUnique({ where: { userId: teacherId } }),
      prisma.class.findUnique({ where: { classId } }),
      prisma.course.findUnique({ where: { courseId } }),
      prisma.schoolYear.findUnique({ where: { schoolYearId } }),
    ]);

    if (
      !teacher ||
      teacher.role !== "INSTRUCTOR" ||
      teacher.status !== "ACTIVE"
    ) {
      return NextResponse.json(
        { error: "Teacher not found, must be an active INSTRUCTOR" },
        { status: 404 },
      );
    }
    if (!classItem) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }
    if (!courseItem) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }
    if (!schoolYearItem) {
      return NextResponse.json(
        { error: "School year not found" },
        { status: 404 },
      );
    }

    // 3. Create the assignment
    const assignment = await prisma.assignment.create({
      data: {
        teacherId,
        classId,
        courseId,
        schoolYearId,
      },
      include: {
        teacher: { select: { userId: true, name: true, lastname: true } },
        class: true,
        course: true,
        schoolYear: true,
      },
    });

    return NextResponse.json(
      { message: "Assignment created successfully", assignment },
      { status: 201 },
    );
  } catch (error) {
    // 4. Handle unique constraint violation (duplicate assignment)
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "This assignment already exists" },
        { status: 409 },
      );
    }
    console.error("POST /api/assignment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const accessError = await verifyAdminAccess(req);
    if (accessError) return accessError;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = assignmentUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { id, classId, courseId, schoolYearId } = parsed.data;

    const updatedAssignment = await prisma.assignment.update({
      where: { assignmentId: id },
      data: {
        ...(classId && { classId }),
        ...(courseId && { courseId }),
        ...(schoolYearId && { schoolYearId }),
      },
    });

    return NextResponse.json({
      message: "Assignment updated successfully",
      assignment: updatedAssignment,
    });
  } catch (error) {
    console.error("PATCH /api/assignment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
