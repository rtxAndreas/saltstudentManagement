import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUserFromRequest } from "@/lib/auth";
import { verifyAdminAccess } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { computeClassResults } from "@/lib/reportCards";

const updateSchema = z.object({
  appreciation: z.string().max(1000).optional(),
  status: z.literal("VALIDATED").optional(),
});

async function loadReportCardForUser(
  reportCardId: number,
  userId: number,
  role: string,
) {
  const card = await prisma.reportCard.findUnique({
    where: { reportCardId },
    include: {
      enrollment: {
        include: {
          student: { include: { guardians: { include: { guardian: true } } } },
          class: true,
          schoolYear: true,
        },
      },
      period: true,
      validatedBy: { select: { userId: true, name: true, lastname: true } },
    },
  });
  if (!card) return { card: null, forbidden: false };

  if (["SUPER_ADMIN", "ADMIN"].includes(role))
    return { card, forbidden: false };
  if (role === "INSTRUCTOR") {
    const assigned = await prisma.assignment.findFirst({
      where: { classId: card.enrollment.classId, teacherId: userId },
      select: { assignmentId: true },
    });
    return { card, forbidden: !assigned };
  }
  if (role === "STUDENT")
    return { card, forbidden: card.enrollment.student.userId !== userId };
  if (role === "PARENT") {
    const allowed = card.enrollment.student.guardians.some(
      (link) => link.guardian.userId === userId,
    );
    return { card, forbidden: !allowed };
  }
  return { card, forbidden: true };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUserFromRequest(req);
  if (!user)
    return NextResponse.json({ error: "Access denied" }, { status: 403 });

  const reportCardId = Number((await params).id);
  if (!Number.isInteger(reportCardId)) {
    return NextResponse.json(
      { error: "Invalid report card ID" },
      { status: 400 },
    );
  }

  const { card, forbidden } = await loadReportCardForUser(
    reportCardId,
    user.userId,
    user.role,
  );
  if (!card)
    return NextResponse.json(
      { error: "Report card not found" },
      { status: 404 },
    );
  if (forbidden)
    return NextResponse.json({ error: "Access denied" }, { status: 403 });

  const classResults = await computeClassResults(
    card.enrollment.classId,
    card.periodId,
  );
  const row =
    classResults?.rows.find(
      (item) => item.enrollmentId === card.enrollmentId,
    ) ?? null;

  return NextResponse.json({
    card,
    row,
    className: classResults?.className ?? card.enrollment.class.name,
    classAverage: classResults?.classAverage ?? null,
    courses: classResults?.courses ?? [],
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const accessError = await verifyAdminAccess(req);
  if (accessError) return accessError;
  const user = await getUserFromRequest(req);

  const reportCardId = Number((await params).id);
  if (!Number.isInteger(reportCardId)) {
    return NextResponse.json(
      { error: "Invalid report card ID" },
      { status: 400 },
    );
  }
  const parsed = updateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const existing = await prisma.reportCard.findUnique({
    where: { reportCardId },
    include: {
      enrollment: {
        include: {
          student: {
            include: {
              class: true,
              guardians: {
                include: { guardian: { select: { userId: true } } },
              },
            },
          },
        },
      },
      period: true,
    },
  });
  if (!existing)
    return NextResponse.json(
      { error: "Report card not found" },
      { status: 404 },
    );

  const data = {
    ...(parsed.data.appreciation !== undefined
      ? { appreciation: parsed.data.appreciation }
      : {}),
    ...(parsed.data.status
      ? {
          status: "VALIDATED" as const,
          validatedById: user?.userId,
          validatedAt: new Date(),
        }
      : {}),
  };
  const card = await prisma.reportCard.update({
    where: { reportCardId },
    data,
  });

  if (parsed.data.status) {
    const recipientIds = [
      ...new Set([
        ...(existing.enrollment.student.userId
          ? [existing.enrollment.student.userId]
          : []),
        ...existing.enrollment.student.guardians.map(
          (link) => link.guardian.userId,
        ),
      ]),
    ];
    if (recipientIds.length) {
      await prisma.notification.create({
        data: {
          title: "Bulletin disponible",
          message: `Le bulletin de ${existing.enrollment.student.firstname} ${existing.enrollment.student.lastname} (${existing.period.label}) est disponible.`,
          type: "REPORT_CARD",
          recipients: { create: recipientIds.map((userId) => ({ userId })) },
        },
      });
    }
  }

  return NextResponse.json(card);
}
