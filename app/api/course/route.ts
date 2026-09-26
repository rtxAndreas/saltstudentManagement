import { CourseStatus } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminAccess, verifyUserAccess } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

const courseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  coefficient: z.number().int().min(1, "Coefficient must be at least 1"),
  classIds: z.array(z.number()).optional(),
  statusCourse: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

const courseStatusSchema = z.object({
  id: z.number().int().positive(),
  statusCourse: z.enum(["ACTIVE", "INACTIVE"]),
});

export async function GET(req: NextRequest) {
  try {
    const accessError = await verifyUserAccess(req);
    if (accessError) return accessError;

    const courses = await prisma.course.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        classes: true,
      },
    });

    return NextResponse.json(courses);
  } catch (error) {
    console.error("GET /api/course error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const accessError = await verifyAdminAccess(req);
    if (accessError) return accessError;

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = courseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { name, code, coefficient, classIds, statusCourse } = parsed.data;

    const existingCourse = await prisma.course.findFirst({
      where: { code },
    });
    if (existingCourse) {
      return NextResponse.json(
        { error: "A course with this code already exists." },
        { status: 409 },
      );
    }

    const course = await prisma.course.create({
      data: {
        name,
        code,
        coefficient,
        statusCourse: statusCourse || CourseStatus.ACTIVE,
        classes: {
          connect: classIds?.map((id) => ({ classId: id })) || [],
        },
      },
      include: {
        classes: true,
      },
    });

    return NextResponse.json(
      { message: "Course created successfully", course },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/course error:", error);
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

    const parsed = courseStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { id, statusCourse } = parsed.data;

    const updatedCourse = await prisma.course.update({
      where: { courseId: id },
      data: { statusCourse: statusCourse as CourseStatus },
      include: {
        classes: true,
      },
    });

    return NextResponse.json({
      message: "Course status updated successfully",
      course: updatedCourse,
    });
  } catch (error) {
    console.error("PATCH /api/course error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
