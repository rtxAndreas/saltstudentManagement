import { Prisma } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminAccess } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

const updateCourseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  coefficient: z.number().int().min(1, "Coefficient must be at least 1"),
  classIds: z.array(z.number()).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const accessError = await verifyAdminAccess(req);
    if (accessError) return accessError;

    const { id } = await params;
    const courseId = Number(id);

    if (Number.isNaN(courseId)) {
      return NextResponse.json({ error: "Invalid course ID" }, { status: 400 });
    }

    const courseItem = await prisma.course.findUnique({
      where: { courseId },
      include: {
        classes: true,
      },
    });

    if (!courseItem) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }
    return NextResponse.json(courseItem);
  } catch (error) {
    console.error("GET /api/course/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const accessError = await verifyAdminAccess(req);
    if (accessError) return accessError;
    const { id } = await params;
    const courseId = Number(id);

    if (Number.isNaN(courseId)) {
      return NextResponse.json({ error: "Invalid course ID" }, { status: 400 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = updateCourseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { name, code, coefficient, classIds } = parsed.data;

    const courseItem = await prisma.course.findUnique({
      where: { courseId },
    });

    if (!courseItem) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const existingCourse = await prisma.course.findFirst({
      where: {
        code,
        NOT: { courseId },
      },
    });
    if (existingCourse) {
      return NextResponse.json(
        { error: "A course with this code already exists." },
        { status: 409 },
      );
    }

    const updatedCourse = await prisma.course.update({
      where: { courseId },
      data: {
        name,
        code,
        coefficient,
        classes: {
          set: classIds?.map((cid) => ({ classId: cid })) || [],
        },
      },
      include: {
        classes: true,
      },
    });

    return NextResponse.json({
      message: "Course updated successfully",
      course: updatedCourse,
    });
  } catch (error) {
    console.error("PUT /api/course/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const accessError = await verifyAdminAccess(req);
    if (accessError) return accessError;
    const { id } = await params;
    const courseId = Number(id);

    if (Number.isNaN(courseId)) {
      return NextResponse.json({ error: "Invalid course ID" }, { status: 400 });
    }

    await prisma.course.delete({
      where: { courseId },
    });

    return NextResponse.json({ message: "Course deleted successfully" });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json(
          { error: "Course not found" },
          { status: 404 },
        );
      }
    }
    console.error("DELETE /api/course/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
