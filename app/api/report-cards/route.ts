import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUserFromRequest } from "@/lib/auth";
import { verifyAdminAccess } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { computeClassResults, saveClassReportCards } from "@/lib/reportCards";

const generateSchema = z.object({
  classId: z.number().int().positive(),
  periodId: z.number().int().positive(),
  validate: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || !["SUPER_ADMIN", "ADMIN", "INSTRUCTOR"].includes(user.role)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const classId = Number(searchParams.get("classId"));
  const periodId = Number(searchParams.get("periodId"));
  if (!Number.isInteger(classId) || !Number.isInteger(periodId)) {
    return NextResponse.json(
      { error: "classId and periodId are required" },
      { status: 400 },
    );
  }
  if (user.role === "INSTRUCTOR") {
    const assigned = await prisma.assignment.findFirst({
      where: { classId, teacherId: user.userId },
      select: { assignmentId: true },
    });
    if (!assigned)
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const results = await computeClassResults(classId, periodId);
  if (!results)
    return NextResponse.json(
      { error: "Class or period not found" },
      { status: 404 },
    );

  const enrollmentIds = results.rows.map((row) => row.enrollmentId);
  const cards = await prisma.reportCard.findMany({
    where: { periodId, enrollmentId: { in: enrollmentIds } },
  });
  return NextResponse.json({
    results,
    cards: Object.fromEntries(cards.map((card) => [card.enrollmentId, card])),
  });
}

export async function POST(req: NextRequest) {
  const accessError = await verifyAdminAccess(req);
  if (accessError) return accessError;

  const parsed = generateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const period = await prisma.period.findUnique({
    where: { periodId: parsed.data.periodId },
  });
  if (!period)
    return NextResponse.json({ error: "Period not found" }, { status: 404 });

  const saved = await saveClassReportCards(
    parsed.data.classId,
    parsed.data.periodId,
  );
  if (!saved)
    return NextResponse.json({ error: "Class not found" }, { status: 404 });

  if (parsed.data.validate && saved.results.rows.length) {
    const user = await getUserFromRequest(req);
    await prisma.reportCard.updateMany({
      where: {
        periodId: parsed.data.periodId,
        enrollmentId: { in: saved.results.rows.map((row) => row.enrollmentId) },
        status: "DRAFT",
      },
      data: {
        status: "VALIDATED",
        validatedById: user?.userId,
        validatedAt: new Date(),
      },
    });
  }

  return NextResponse.json(
    { saved: saved.saved, results: saved.results },
    { status: 201 },
  );
}
