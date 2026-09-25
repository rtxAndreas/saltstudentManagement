import { ExamDistributionType } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminAccess, verifyUserAccess } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

const createSchema = z
  .object({
    title: z.string().trim().min(2),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    schoolYearId: z.number().int().positive(),
    distributionType: z.nativeEnum(ExamDistributionType).default("BY_CLASS"),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    path: ["endDate"],
    message: "End date must be after start date",
  });

export async function GET(req: NextRequest) {
  const accessError = await verifyUserAccess(req);
  if (accessError) return accessError;
  const sessions = await prisma.examSession.findMany({
    orderBy: { startDate: "desc" },
    include: {
      schoolYear: { select: { schoolYearId: true, label: true } },
      _count: { select: { allocations: true, slots: true } },
    },
  });
  return NextResponse.json(sessions);
}

export async function POST(req: NextRequest) {
  const accessError = await verifyAdminAccess(req);
  if (accessError) return accessError;
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }
  const schoolYear = await prisma.schoolYear.findUnique({
    where: { schoolYearId: parsed.data.schoolYearId },
  });
  if (!schoolYear) {
    return NextResponse.json(
      { error: "School year not found" },
      { status: 404 },
    );
  }
  const session = await prisma.examSession.create({
    data: {
      ...parsed.data,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
    },
  });
  return NextResponse.json(
    { message: "Exam session created", session },
    { status: 201 },
  );
}
