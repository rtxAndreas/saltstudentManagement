import { Status } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminAccess } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

const schoolYearSchema = z
  .object({
    label: z.string().min(1, "Label is required"),
    startDate: z.string().datetime("Invalid startDate format"),
    endDate: z.string().datetime("Invalid endDate format"),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: "endDate must be after startDate",
    path: ["endDate"],
  });

const schoolYearStatusSchema = z.object({
  id: z.number().int().positive(),
  status: z.literal(Status.ACTIVE),
});

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

    const parsed = schoolYearSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { label, startDate, endDate } = parsed.data;

    const schoolYear = await prisma.$transaction(async (tx) => {
      const existingActive = await prisma.schoolYear.findFirst({
        where: { status: Status.ACTIVE },
        select: { schoolYearId: true, label: true },
      });

      if (existingActive) {
        throw new Error("ACTIVE_EXISTS");
      }

      return tx.schoolYear.create({
        data: {
          label,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          status: Status.ACTIVE,
        },
      });
    });

    return NextResponse.json(
      { message: "School year created successfully", schoolYear },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "ACTIVE_EXISTS") {
        return NextResponse.json(
          { error: "An active school year already exists" },
          { status: 409 },
        );
      }
    }

    console.error("POST /api/schoolYear error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const schoolYears = await prisma.schoolYear.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json(schoolYears);
  } catch (error) {
    console.error("GET /api/schoolYear error:", error);
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

    const parsed = schoolYearStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { id } = parsed.data;

    const updatedSchoolYear = await prisma.$transaction(async (tx) => {
      const target = await tx.schoolYear.findUnique({
        where: { schoolYearId: id },
      });

      if (!target) {
        throw new Error("NOT_FOUND");
      }

      await tx.schoolYear.updateMany({
        where: { status: Status.ACTIVE },
        data: { status: Status.INACTIVE },
      });

      return tx.schoolYear.update({
        where: { schoolYearId: id },
        data: { status: Status.ACTIVE },
      });
    });

    return NextResponse.json({
      message: "School year activated successfully",
      schoolYear: updatedSchoolYear,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json(
        { error: "School year not found" },
        { status: 404 },
      );
    }
    console.error("PATCH /api/schoolYear error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
