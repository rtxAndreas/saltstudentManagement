import { PeriodStatus } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminAccess } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

export const periodSchema = z
  .object({
    label: z.string().min(1, "Label is required"),
    startDate: z.string().datetime("Invalid startDate format"),
    endDate: z.string().datetime("Invalid endDate format"),
    schoolYearId: z.number().int("School year ID must be an integer"),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: "endDate must be after startDate",
    path: ["endDate"],
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

    const parsed = periodSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { label, startDate, endDate, schoolYearId } = parsed.data;

    // Verify the referenced school year exists
    const schoolYear = await prisma.schoolYear.findUnique({
      where: { schoolYearId },
    });

    if (!schoolYear) {
      return NextResponse.json(
        { error: "School year not found" },
        { status: 404 },
      );
    }

    const period = await prisma.period.create({
      data: {
        label,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        schoolYearId,
        status: PeriodStatus.DRAFT,
      },
    });

    return NextResponse.json(
      { message: "Period created successfully", period },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/period error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const periods = await prisma.period.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        schoolYear: true,
      },
    });
    return NextResponse.json(periods);
  } catch (error) {
    console.error("GET /api/period error:", error);
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

    if (!id || !Object.values(PeriodStatus).includes(status as PeriodStatus)) {
      return NextResponse.json(
        { error: "Invalid request. 'id' and valid 'status' are required." },
        { status: 400 },
      );
    }

    const updatedPeriod = await prisma.$transaction(async (tx) => {
      const target = await tx.period.findUnique({
        where: { periodId: id },
      });

      if (!target) {
        throw new Error("NOT_FOUND");
      }

      return tx.period.update({
        where: { periodId: id },
        data: { status: status as PeriodStatus },
      });
    });

    return NextResponse.json({
      message: "Period status updated successfully",
      period: updatedPeriod,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Period not found" }, { status: 404 });
    }
    console.error("PATCH /api/period error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
