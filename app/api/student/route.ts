import { Status } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminAccess, verifyUserAccess } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

const studentSchema = z.object({
  registrationNumber: z.string().optional(),
  lastname: z.string().min(1, "Lastname is required"),
  firstname: z.string().min(1, "Firstname is required"),
  gender: z.enum(["MALE", "FEMALE"]),
  birthDate: z.string().min(1, "Birth date is required"),
  birthPlace: z.string().optional(),
  address: z.string().optional(),
  parentPhone: z.string().optional(),
  parentEmail: z.string().optional(),
  classId: z.number().int().positive("Class is required"),
});

const studentStatusSchema = z.object({
  id: z.number().int().positive(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export async function GET(req: NextRequest) {
  try {
    const accessError = await verifyUserAccess(req);
    if (accessError) return accessError;

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");

    const where: Record<string, unknown> = {};
    if (classId) {
      where.classId = Number(classId);
    }

    // Legacy mode: consumers (grade form, user form, attendance) expect a
    // plain array. Paginated mode is used by the students directory page.
    const pageParam = searchParams.get("page");
    if (!pageParam) {
      const students = await prisma.student.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: { class: true },
      });

      return NextResponse.json(students);
    }

    const page = Math.max(1, Number(pageParam) || 1);
    const limit = Math.min(
      50,
      Math.max(1, Number(searchParams.get("limit")) || 10),
    );
    const search = (searchParams.get("search") ?? "").trim();
    const status = searchParams.get("status");
    const gender = searchParams.get("gender");

    if (status === "ACTIVE" || status === "INACTIVE") where.status = status;
    if (gender === "MALE" || gender === "FEMALE") where.gender = gender;
    if (search) {
      where.OR = [
        { lastname: { contains: search } },
        { firstname: { contains: search } },
        { registrationNumber: { contains: search } },
      ];
    }

    const [students, total, activeCount, inactiveCount, activeYear] =
      await Promise.all([
        prisma.student.findMany({
          where,
          orderBy: { createdAt: "desc" },
          include: { class: true },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.student.count({ where }),
        prisma.student.count({ where: { status: "ACTIVE" } }),
        prisma.student.count({ where: { status: "INACTIVE" } }),
        prisma.schoolYear.findFirst({ where: { status: "ACTIVE" } }),
      ]);

    const newEnrollments = activeYear
      ? await prisma.enrollment.count({
          where: { schoolYearId: activeYear.schoolYearId },
        })
      : 0;

    return NextResponse.json({
      data: students,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      stats: {
        total: activeCount + inactiveCount,
        active: activeCount,
        inactive: inactiveCount,
        newEnrollments,
      },
    });
  } catch (error) {
    console.error("GET /api/student error:", error);
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

    const parsed = studentSchema.safeParse(body);
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
      registrationNumber,
      lastname,
      firstname,
      gender,
      birthDate,
      birthPlace,
      address,
      parentPhone,
      parentEmail,
      classId,
    } = parsed.data;

    const classItem = await prisma.class.findUnique({ where: { classId } });
    if (!classItem) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    const student = await prisma.$transaction(async (tx) => {
      const created = await tx.student.create({
        data: {
          registrationNumber: registrationNumber || null,
          lastname,
          firstname,
          gender,
          birthDate: new Date(birthDate),
          birthPlace: birthPlace || null,
          address: address || null,
          parentPhone: parentPhone || null,
          parentEmail: parentEmail || null,
          status: Status.ACTIVE,
          classId,
        },
      });
      await tx.enrollment.create({
        data: {
          studentId: created.studentId,
          classId,
          schoolYearId: classItem.schoolYearId,
        },
      });
      return tx.student.findUniqueOrThrow({
        where: { studentId: created.studentId },
        include: { class: true },
      });
    });

    return NextResponse.json(
      { message: "Student created successfully", student },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/student error:", error);
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

    const parsed = studentStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { id, status } = parsed.data;

    const updatedStudent = await prisma.student.update({
      where: { studentId: id },
      data: { status: status as Status },
    });

    return NextResponse.json({
      message: "Student status updated successfully",
      student: updatedStudent,
    });
  } catch (error) {
    console.error("PATCH /api/student error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
