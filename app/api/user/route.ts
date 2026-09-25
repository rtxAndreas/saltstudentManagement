import type { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { determineUserRole } from "@/lib/adminUtils";
import { verifyAdminAccess } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

const createUserSchema = z.object({
  name: z.string().trim().min(1),
  lastname: z.string().trim().optional(),
  contact: z.string().trim().optional(),
  email: z.string().trim().email(),
  password: z.string().min(4),
  role: z
    .enum(["ADMIN", "ACCOUNTANT", "INSTRUCTOR", "STUDENT", "PARENT"])
    .optional(),
  registrationNumber: z.string().trim().optional(),
  studentId: z.number().int().positive().optional(),
  childStudentIds: z.array(z.number().int().positive()).optional(),
});

export async function POST(_req: NextRequest) {
  try {
    const accessError = await verifyAdminAccess(_req);
    if (accessError) return accessError;

    let body: unknown;
    try {
      body = await _req.json();
    } catch {
      return NextResponse.json(
        { message: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Validation failed",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const {
      name,
      email,
      password,
      role,
      lastname,
      contact,
      registrationNumber,
      studentId,
      childStudentIds,
    } = parsed.data;

    if (role === "STUDENT" && !studentId) {
      return NextResponse.json(
        { message: "A student account must be linked to a student" },
        { status: 400 },
      );
    }
    if (
      role === "PARENT" &&
      (!childStudentIds || childStudentIds.length === 0)
    ) {
      return NextResponse.json(
        { message: "A parent account must be linked to at least one student" },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userRole = role || (await determineUserRole(email, prisma));

    const user = await prisma.$transaction(async (tx) => {
      if (studentId) {
        const student = await tx.student.findUnique({ where: { studentId } });
        if (!student || student.userId) throw new Error("STUDENT_UNAVAILABLE");
      }
      if (childStudentIds?.length) {
        const children = await tx.student.count({
          where: { studentId: { in: [...new Set(childStudentIds)] } },
        });
        if (children !== new Set(childStudentIds).size)
          throw new Error("CHILD_NOT_FOUND");
      }
      const created = await tx.user.create({
        data: {
          name,
          lastname: lastname || "",
          contact: contact || "",
          registrationNumber: registrationNumber || null,
          email: email.toLowerCase(),
          password: hashedPassword,
          role: userRole as Role,
        },
      });
      if (role === "STUDENT" && studentId) {
        await tx.student.update({
          where: { studentId },
          data: { userId: created.userId },
        });
      }
      if (role === "PARENT" && childStudentIds?.length) {
        await tx.guardian.create({
          data: {
            userId: created.userId,
            students: {
              create: [...new Set(childStudentIds)].map((childId, index) => ({
                studentId: childId,
                isPrimary: index === 0,
              })),
            },
          },
        });
      }
      return tx.user.findUniqueOrThrow({
        where: { userId: created.userId },
        select: {
          userId: true,
          name: true,
          lastname: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
        },
      });
    });

    return NextResponse.json(
      { message: "User created successfully", user },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "STUDENT_UNAVAILABLE") {
      return NextResponse.json(
        { message: "Student not found or already has an account" },
        { status: 409 },
      );
    }
    if (error instanceof Error && error.message === "CHILD_NOT_FOUND") {
      return NextResponse.json(
        { message: "One or more students were not found" },
        { status: 404 },
      );
    }
    console.error("POST /api/user error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const accessError = await verifyAdminAccess(req);
    if (accessError) return accessError;

    const users = await prisma.user.findMany({
      select: {
        userId: true,
        name: true,
        lastname: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error("GET /api/user error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
