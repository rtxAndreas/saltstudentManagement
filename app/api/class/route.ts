import { ClassStatus, Status } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminAccess, verifyUserAccess } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

const classSchema = z.object({
  name: z.string().min(1, "Name is required"),
  level: z.string().min(1, "Level is required"),
  status: z.nativeEnum(ClassStatus).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const accessError = await verifyUserAccess(req);
    if (accessError) return accessError;

    const classes = await prisma.class.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        schoolYear: true,
      },
    });

    return NextResponse.json(classes);
  } catch (error) {
    console.error("GET /api/class error:", error);
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

    const parsed = classSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { name, level, status } = parsed.data;

    const classItem = await prisma.$transaction(async (tx) => {
      const activeSchoolYear = await tx.schoolYear.findFirst({
        where: { status: Status.ACTIVE },
      });

      if (!activeSchoolYear) {
        throw new Error("NO_ACTIVE_SCHOOL_YEAR");
      }

      const existingActive = await tx.class.findFirst({
        where: {
          name,
          level,
          status: ClassStatus.ACTIVE,
          schoolYearId: activeSchoolYear.schoolYearId,
        },
      });

      if (existingActive) {
        throw new Error("ACTIVE_EXISTS");
      }

      return tx.class.create({
        data: {
          name,
          level,
          status: status || ClassStatus.ACTIVE,
          schoolYearId: activeSchoolYear.schoolYearId,
        },
      });
    });

    return NextResponse.json(
      { message: "Class created successfully", class: classItem },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "NO_ACTIVE_SCHOOL_YEAR") {
        return NextResponse.json(
          {
            error:
              "No active school year found. Please create or activate a school year first.",
          },
          { status: 400 },
        );
      }
      if (error.message === "ACTIVE_EXISTS") {
        return NextResponse.json(
          {
            error:
              "The same class is already active in the current school year",
          },
          { status: 409 },
        );
      }
    }

    console.error("POST /api/class error:", error);
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

    const { id, status } = body as { id: number; status: string };

    if (!id || !Object.values(ClassStatus).includes(status as ClassStatus)) {
      return NextResponse.json(
        { error: "Invalid request. 'id' and valid 'status' are required." },
        { status: 400 },
      );
    }

    const updatedClass = await prisma.class.update({
      where: { classId: id },
      data: { status: status as ClassStatus },
    });

    return NextResponse.json({
      message: "Class status updated successfully",
      class: updatedClass,
    });
  } catch (error) {
    console.error("PATCH /api/class error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
