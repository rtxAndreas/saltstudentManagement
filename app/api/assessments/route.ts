import { AssessmentType } from "@prisma/client";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUserFromRequest } from "@/lib/auth";
import { getClassRecipientIds } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  title: z.string().trim().min(2),
  type: z.nativeEnum(AssessmentType),
  maxScore: z.number().positive(),
  coefficient: z.number().positive(),
  scheduledAt: z.string().datetime().optional(),
  assignmentId: z.number().int().positive(),
  periodId: z.number().int().positive(),
  publish: z.boolean().default(false),
});
const publishSchema = z.object({
  id: z.number().int().positive(),
  publish: z.boolean(),
});
export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || !["SUPER_ADMIN", "ADMIN", "INSTRUCTOR"].includes(user.role))
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  return NextResponse.json(
    await prisma.assessment.findMany({
      where:
        user.role === "INSTRUCTOR"
          ? { assignment: { teacherId: user.userId } }
          : {},
      orderBy: { createdAt: "desc" },
      include: {
        period: true,
        assignment: {
          include: {
            course: true,
            class: true,
            teacher: { select: { name: true, lastname: true } },
          },
        },
        _count: { select: { grades: true } },
      },
    }),
  );
}
export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || !["SUPER_ADMIN", "ADMIN", "INSTRUCTOR"].includes(user.role))
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json(
      {
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  const [assignment, period] = await Promise.all([
    prisma.assignment.findUnique({
      where: { assignmentId: parsed.data.assignmentId },
    }),
    prisma.period.findUnique({ where: { periodId: parsed.data.periodId } }),
  ]);
  if (!assignment || !period || assignment.schoolYearId !== period.schoolYearId)
    return NextResponse.json(
      { error: "Assignment and period must belong to the same school year" },
      { status: 400 },
    );
  if (user.role === "INSTRUCTOR" && assignment.teacherId !== user.userId)
    return NextResponse.json(
      { error: "You can only create evaluations for your assignments" },
      { status: 403 },
    );
  const { publish, scheduledAt, ...input } = parsed.data;
  const assessment = await prisma.assessment.create({
    data: {
      ...input,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      publishedAt: publish ? new Date() : null,
    },
  });
  return NextResponse.json(
    { message: "Assessment created", assessment },
    { status: 201 },
  );
}
export async function PATCH(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user || !["SUPER_ADMIN", "ADMIN", "INSTRUCTOR"].includes(user.role))
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  const parsed = publishSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const current = await prisma.assessment.findUnique({
    where: { assessmentId: parsed.data.id },
    include: { assignment: { include: { course: true } } },
  });
  if (
    !current ||
    (user.role === "INSTRUCTOR" && current.assignment.teacherId !== user.userId)
  )
    return NextResponse.json(
      { error: "Assessment not found" },
      { status: 404 },
    );
  const assessment = await prisma.$transaction(async (tx) => {
    const updated = await tx.assessment.update({
      where: { assessmentId: current.assessmentId },
      data: { publishedAt: parsed.data.publish ? new Date() : null },
    });
    if (parsed.data.publish && !current.publishedAt) {
      const ids = await getClassRecipientIds(tx, current.assignment.classId);
      if (ids.length)
        await tx.notification.create({
          data: {
            title: `Évaluation — ${current.title}`,
            message: `${current.assignment.course.name} : ${current.title}${current.scheduledAt ? ` le ${current.scheduledAt.toLocaleDateString("fr-FR")}` : ""}.`,
            type: "GRADE_PUBLISHED",
            audience: "CLASS",
            classId: current.assignment.classId,
            createdById: user.userId,
            recipients: { create: ids.map((userId) => ({ userId })) },
          },
        });
    }
    return updated;
  });
  return NextResponse.json({ message: "Assessment updated", assessment });
}
