import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminAccess } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

const schema = z
  .object({
    assignmentId: z.number().int().positive(),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
  })
  .refine((data) => new Date(data.endsAt) > new Date(data.startsAt), {
    path: ["endsAt"],
    message: "End time must be after start time",
  });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const accessError = await verifyAdminAccess(req);
  if (accessError) return accessError;
  const examSessionId = Number((await params).id);
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!Number.isInteger(examSessionId) || !parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: parsed.success
          ? undefined
          : parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }
  const session = await prisma.examSession.findUnique({
    where: { examSessionId },
  });
  const assignment = await prisma.assignment.findUnique({
    where: { assignmentId: parsed.data.assignmentId },
  });
  if (!session || !assignment) {
    return NextResponse.json(
      { error: "Session or assignment not found" },
      { status: 404 },
    );
  }
  if (assignment.schoolYearId !== session.schoolYearId) {
    return NextResponse.json(
      {
        error:
          "Assignment and exam session must belong to the same school year",
      },
      { status: 409 },
    );
  }
  const startsAt = new Date(parsed.data.startsAt);
  const endsAt = new Date(parsed.data.endsAt);
  if (startsAt < session.startDate || endsAt > session.endDate) {
    return NextResponse.json(
      { error: "Exam slot must be inside the session dates" },
      { status: 400 },
    );
  }

  // EXAM-005: a class cannot have two incompatible exams at the same time
  const classOverlap = await prisma.examSlot.findFirst({
    where: {
      assignment: { classId: assignment.classId },
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
    },
    include: {
      examSession: true,
      assignment: { include: { class: true, course: true } },
    },
  });
  if (classOverlap) {
    return NextResponse.json(
      {
        error: `Conflit : la classe ${classOverlap.assignment.class.name} a déjà un examen (${classOverlap.assignment.course.name}) sur ce créneau.`,
      },
      { status: 409 },
    );
  }

  const slot = await prisma.examSlot.create({
    data: {
      examSessionId,
      assignmentId: assignment.assignmentId,
      startsAt,
      endsAt,
    },
  });
  return NextResponse.json(
    { message: "Exam slot created", slot },
    { status: 201 },
  );
}
